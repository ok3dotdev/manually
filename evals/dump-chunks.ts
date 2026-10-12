// Run the statute chunker on a real PDF and print what it produced.
// Usage: npx tsx evals/dump-chunks.ts path/to/rta.pdf [section]
//   e.g. npx tsx evals/dump-chunks.ts ~/Downloads/rta.pdf 26
import { readFileSync } from 'node:fs';
import { extractPdfText } from '../lib/ai/pdf';
import { chunkStatute, looksLikeStatute } from '../lib/ai/legal-chunker';

const [file, onlySection] = process.argv.slice(2);
if (!file) throw new Error('Usage: tsx evals/dump-chunks.ts <pdf> [section]');

// tsx compiles .ts as CommonJS here (no "type": "module"), so no top-level await.
const main = async () => {
  const buf = readFileSync(file);
  const { text } = await extractPdfText(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  console.log('looksLikeStatute:', looksLikeStatute(text));

  const chunks = chunkStatute(text, { docLabel: 'RTA' });
  console.log('chunks:', chunks.length);

  // Section numbers should never go backwards; gaps are worth a look.
  const sections = [...new Set(chunks.map(c => c.section))];
  console.log('sections found:', sections.length, `(first ${sections[0]}, last ${sections.at(-1)})`);

  for (const c of chunks.filter(c => !onlySection || c.section === onlySection)) {
    console.log(`\n--- ${c.citation} (${c.content.length} chars)\n${c.content}`);
  }
};

main();
