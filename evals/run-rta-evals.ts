// Run the RTA eval set through the real agent and score each answer.
// Usage: npm run evals [-- --only <id,...>] [--repeat N] [--concurrency N] [--model <gateway id>]
//        npm run evals -- --rescore evals/results/<report>.json
//
// Reads from the knowledge base of EVAL_USER_ID, or by default the owner of
// the most recently uploaded statute (a resource with citation-labelled
// chunks). addResource is stubbed, so a run never writes to the database.
// Writes a JSON report to evals/results/.
//
// The AI Gateway team limit is 5 requests/minute for gpt-4o-mini, so cases run
// one at a time by default and rate-limited calls wait and retry. A case that
// still can't run is reported as ERROR, not FAIL.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import type { ModelMessage } from 'ai';
import { desc, eq, isNotNull } from 'drizzle-orm';
import { createRagAgent } from '../lib/agents/rag-agent';
import { addResourceTool } from '../lib/agents/tools/add-resource';
import { getDb } from '../lib/db';
import { embeddings } from '../lib/db/schema/embeddings';
import { resources } from '../lib/db/schema/resources';
import { evalSet, type EvalCase } from './rta-eval-set';

type Cite = { section: string; sub: string | null };

const SECTION = String.raw`(\d+(?:\.\d+)?)`;
const SUB = String.raw`\((\d+(?:\.\d+)?)\)`;
const citeRegex = (keyword: string) =>
  new RegExp(String.raw`\b(?:${keyword})\s*${SECTION}(?:\s*${SUB})?(?:\s*[-–]\s*${SUB})?`, 'gi');
// "s. 26(3)", "RTA s. 26 (3)", "ss. 48(3)-(4)", "section 96", "subsection 95 (4)"
const CITE_LOOSE = citeRegex(String.raw`ss?\.|sections?|subsections?`);
// Only the agent's own "s. N" form. Quoted statute text says "section 120",
// which isn't a citation by the agent.
const CITE_STRICT = citeRegex(String.raw`ss?\.`);
// Eval spec form: "26(3)" or "95"
const CITE_SPEC = new RegExp(String.raw`^${SECTION}(?:${SUB})?$`);

const parseSpec = (spec: string): Cite => {
  const m = spec.replace(/\s+/g, '').match(CITE_SPEC);
  if (!m) throw new Error(`Bad citation spec "${spec}"`);
  return { section: m[1], sub: m[2] ?? null };
};

const citesIn = (text: string, regex = CITE_LOOSE): Cite[] => {
  const out: Cite[] = [];
  for (const m of text.matchAll(regex)) {
    const [, section, from, to] = m;
    if (!from) {
      out.push({ section, sub: null });
    } else if (to && /^\d+$/.test(from) && /^\d+$/.test(to)) {
      // "48(3)-(4)" cites every subsection in the range
      for (let n = Number(from); n <= Number(to); n++) out.push({ section, sub: String(n) });
    } else {
      out.push({ section, sub: from });
    }
  }
  return out;
};

// A section-only spec ("95") matches any subsection of that section.
const matches = (spec: Cite, cite: Cite) =>
  spec.section === cite.section && (spec.sub === null || spec.sub === cite.sub);

const fmt = (c: Cite) => (c.sub ? `${c.section}(${c.sub})` : c.section);

const NUMBER_WORDS: Record<string, string> = {
  one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7',
  eight: '8', nine: '9', ten: '10', eleven: '11', twelve: '12', fourteen: '14',
};

// Case, quote style and "seven days" vs "7 days" shouldn't decide a check.
const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fourteen)\b/g, w => NUMBER_WORDS[w]);

type Check = { name: string; pass: boolean; detail?: string };

type CaseResult = {
  id: string;
  source: EvalCase['source'];
  run: number;
  status: 'pass' | 'fail' | 'error';
  checks: Check[];
  answer: string;
  answerCites: string[];
  retrieved: string[];
  searches: string[];
  addResourceAttempts: string[];
  error?: string;
  ms: number;
};

const score = (c: EvalCase, answer: string, retrieved: Cite[]): Check[] => {
  const cites = citesIn(answer);
  const text = normalize(answer);
  const checks: Check[] = [];

  const missingCites = c.mustCite.filter(s => !cites.some(x => matches(parseSpec(s), x)));
  checks.push({ name: 'mustCite', pass: missingCites.length === 0, detail: missingCites.join(', ') });

  if (c.mustNotCite?.length) {
    const wrong = c.mustNotCite.filter(s => cites.some(x => matches(parseSpec(s), x)));
    checks.push({ name: 'mustNotCite', pass: wrong.length === 0, detail: wrong.join(', ') });
  }

  if (c.mustMention?.length) {
    const missing = c.mustMention.filter(k => !text.includes(normalize(k)));
    checks.push({ name: 'mustMention', pass: missing.length === 0, detail: missing.join(' | ') });
  }

  if (c.mustNotSay?.length) {
    const said = c.mustNotSay.filter(p => text.includes(normalize(p)));
    checks.push({ name: 'mustNotSay', pass: said.length === 0, detail: said.join(' | ') });
  }

  // Grounding: every section the answer cites must have come back from
  // retrieval. Citations the user typed (e.g. asking about "26(5)") don't
  // count against it.
  const asked = citesIn([c.question, ...(c.history ?? []).map(h => h.content)].join('\n'));
  const ungrounded = citesIn(answer, CITE_STRICT).filter(
    x => !asked.some(a => matches(a, x)) && !retrieved.some(r => matches(x, r)),
  );
  checks.push({
    name: 'grounded',
    pass: ungrounded.length === 0,
    detail: [...new Set(ungrounded.map(fmt))].join(', '),
  });

  return checks;
};

const findEvalUser = async () => {
  if (process.env.EVAL_USER_ID) return process.env.EVAL_USER_ID;
  const [row] = await getDb()
    .selectDistinct({ userId: embeddings.userId, createdAt: resources.createdAt })
    .from(embeddings)
    .innerJoin(resources, eq(resources.id, embeddings.resourceId))
    .where(isNotNull(embeddings.citation))
    .orderBy(desc(resources.createdAt))
    .limit(1);
  if (!row) throw new Error('No statute with citation labels found. Upload the RTA or set EVAL_USER_ID.');
  return row.userId;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// "...Retry after 60s." -> 60000. Null when the error isn't a rate limit.
const rateLimitDelay = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  if (!/rate limit/i.test(message)) return null;
  return (Number(message.match(/retry after (\d+)\s*s/i)?.[1] ?? 60) + 2) * 1000;
};

const MAX_RATE_LIMIT_RETRIES = 5;

const runCase = async (userId: string, c: EvalCase, run: number, model?: string): Promise<CaseResult> => {
  for (let attempt = 0; ; attempt++) {
    const result = await runCaseOnce(userId, c, run, model);
    const delay = result.status === 'error' ? rateLimitDelay(result.error) : null;
    if (delay === null || attempt >= MAX_RATE_LIMIT_RETRIES) return result;
    console.log(`  ${c.id}: rate limited, retrying in ${Math.round(delay / 1000)}s`);
    await sleep(delay);
  }
};

const runCaseOnce = async (userId: string, c: EvalCase, run: number, model?: string): Promise<CaseResult> => {
  const started = Date.now();
  const addResourceAttempts: string[] = [];
  const agent = createRagAgent(userId, {
    model,
    addResource: {
      ...addResourceTool,
      execute: async ({ content }) => {
        addResourceAttempts.push(content);
        return 'Resource successfully created and embedded.';
      },
    },
  });
  const messages: ModelMessage[] = [
    ...(c.history ?? []),
    { role: 'user', content: c.question },
  ];

  try {
    const result = await agent.generate({ messages });
    const searches: string[] = [];
    const retrievedLabels = new Set<string>();
    for (const step of result.steps) {
      for (const call of step.toolCalls) {
        if (call.toolName === 'getInformation') searches.push((call.input as { question: string }).question);
      }
      for (const r of step.toolResults) {
        if (r.toolName !== 'getInformation') continue;
        for (const row of r.output as { citation: string | null }[]) {
          if (row.citation) retrievedLabels.add(row.citation);
        }
      }
    }
    const retrieved = [...retrievedLabels].flatMap(l => citesIn(l));
    const checks = score(c, result.text, retrieved);
    if (addResourceAttempts.length) {
      checks.push({ name: 'noWrites', pass: false, detail: `${addResourceAttempts.length} addResource call(s)` });
    }
    return {
      id: c.id,
      source: c.source,
      run,
      status: checks.every(x => x.pass) ? 'pass' : 'fail',
      checks,
      answer: result.text,
      answerCites: [...new Set(citesIn(result.text).map(fmt))],
      retrieved: [...retrievedLabels],
      searches,
      addResourceAttempts,
      ms: Date.now() - started,
    };
  } catch (error) {
    return {
      id: c.id,
      source: c.source,
      run,
      status: 'error',
      checks: [],
      answer: '',
      answerCites: [],
      retrieved: [],
      searches: [],
      addResourceAttempts,
      error: error instanceof Error ? error.message : String(error),
      ms: Date.now() - started,
    };
  }
};

// Run tasks with at most `limit` in flight, keeping results in input order.
const pool = async <T>(tasks: (() => Promise<T>)[], limit: number) => {
  const results = new Array<T>(tasks.length);
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]();
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
};

const main = async () => {
  const { values } = parseArgs({
    options: {
      only: { type: 'string' },
      repeat: { type: 'string', default: '1' },
      concurrency: { type: 'string', default: '1' },
      // Re-score a saved report with the current checks, no model calls.
      rescore: { type: 'string' },
      // Gateway model id to test instead of the app's default.
      model: { type: 'string' },
    },
  });
  const only = values.only?.split(',');
  const cases = only ? evalSet.filter(c => only.includes(c.id)) : evalSet;
  const repeat = Number(values.repeat);

  let results: CaseResult[];
  if (values.rescore) {
    const saved: CaseResult[] = JSON.parse(readFileSync(values.rescore, 'utf8')).results;
    results = saved.map(r => {
      const c = evalSet.find(e => e.id === r.id);
      if (!c || r.status === 'error') return r;
      const checks = score(c, r.answer, r.retrieved.flatMap(l => citesIn(l)));
      if (r.addResourceAttempts.length) checks.push({ name: 'noWrites', pass: false });
      return { ...r, checks, status: checks.every(x => x.pass) ? 'pass' : 'fail' };
    });
    console.log(`Re-scoring ${values.rescore}\n`);
  } else {
    const userId = await findEvalUser();
    console.log(
      `Running ${cases.length} case(s) x ${repeat} with ${values.model ?? 'the default model'} against user ${userId.slice(0, 10)}…\n`,
    );
    const tasks = cases.flatMap(c =>
      Array.from({ length: repeat }, (_, run) => () => runCase(userId, c, run, values.model)),
    );
    results = await pool(tasks, Number(values.concurrency));
  }

  for (const r of results) {
    const failed = r.checks.filter(x => !x.pass);
    const why = r.error ?? failed.map(x => `${x.name}${x.detail ? `: ${x.detail}` : ''}`).join('; ');
    console.log(`${r.status.toUpperCase().padEnd(5)} ${r.id}${repeat > 1 ? ` #${r.run + 1}` : ''}  ${why}`);
  }
  const scored = results.filter(r => r.status !== 'error');

  const checkNames = [...new Set(results.flatMap(r => r.checks.map(x => x.name)))];
  console.log('\nBy check:');
  for (const name of checkNames) {
    const applicable = scored.filter(r => r.checks.some(x => x.name === name));
    const passed = applicable.filter(r => r.checks.find(x => x.name === name)!.pass);
    console.log(`  ${name.padEnd(12)} ${passed.length}/${applicable.length}`);
  }
  console.log('\nBy source:');
  for (const source of ['today', 'core', 'guardrail'] as const) {
    const rs = scored.filter(r => r.source === source);
    if (rs.length) console.log(`  ${source.padEnd(12)} ${rs.filter(r => r.status === 'pass').length}/${rs.length}`);
  }
  const passed = scored.filter(r => r.status === 'pass').length;
  const errors = results.length - scored.length;
  console.log(`\nTotal: ${passed}/${scored.length} passed${errors ? `, ${errors} errored (not scored)` : ''}`);

  mkdirSync(new URL('./results/', import.meta.url), { recursive: true });
  const file = new URL(`./results/rta-${new Date().toISOString().replace(/[:.]/g, '-')}.json`, import.meta.url);
  writeFileSync(file, JSON.stringify({ ranAt: new Date().toISOString(), model: values.model ?? 'default', repeat, results }, null, 2));
  console.log(`Report: ${file.pathname}`);

  if (passed < results.length) process.exitCode = 1;
};

main();
