import { readFileSync } from 'node:fs';
import { chunkStatute } from '../lib/ai/legal-chunker';

const text = readFileSync(new URL('./legal-chunker.fixture.txt', import.meta.url), 'utf8');
const chunks = chunkStatute(text, { docLabel: 'RTA' });

for (const c of chunks) console.log('---\n' + c.content + '\n');

const cites = chunks.map(c => c.citation);
const expected = ['s. 25', 's. 26(1)', 's. 26(2)', 's. 26(3)', 's. 27(1)', 's. 27(2)', 's. 27(3)', 's. 95(1)', 's. 95(4)', 's. 96(1)', 's. 108'];
const missing = expected.filter(e => !cites.includes(e));
const extra = cites.filter(c => !expected.includes(c));
const c263 = chunks.find(c => c.citation === 's. 26(3)')!;
const checks = {
  allSectionsFound: missing.length === 0,
  noExtraSections: extra.length === 0,
  '26(3) heading': c263.heading === 'Entry to show rental unit to prospective tenants',
  '26(3) has clause (c)': c263.content.includes('reasonable effort'),
  '27(1) keeps wrapped "Professional Engineers Act" line': chunks.find(c => c.citation === 's. 27(1)')!.content.includes('Professional Engineers Act or a'),
  'page footer not a heading on 95': !chunks.find(c => c.citation === 's. 95(1)')!.content.includes('Page 23'),
  '"Same" resolved on 27(2)': chunks.find(c => c.citation === 's. 27(2)')!.heading === 'Entry with notice',
  'part tracked': chunks.find(c => c.citation === 's. 95(1)')!.part?.startsWith('Part VI') === true,
  '108 heading ending in "etc."': chunks.find(c => c.citation === 's. 108')!.heading === 'Post-dated cheques, etc.',
  '96(1) does not swallow next heading': !chunks.find(c => c.citation === 's. 96(1)')!.content.includes('Post-dated'),
};
console.log({ cites, missing, extra, checks });
if (Object.values(checks).some(v => !v)) process.exit(1);
