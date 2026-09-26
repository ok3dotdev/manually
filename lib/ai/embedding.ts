import { embed, embedMany } from 'ai';
import { cosineDistance, desc, gt, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { embeddings } from '@/lib/db/schema/embeddings';

const embeddingModel = 'cohere/embed-v4.0';

const MAX_CHUNK_CHARS = 500;
// Cohere embed-v4 scores run lower than OpenAI's; correct matches can sit
// below 0.5, so a higher cutoff silently drops them.
const MIN_SIMILARITY = 0.3;

const isBulletLine = (line: string) => /^[•*-]\s|^\d+[.)]\s/.test(line);

// Split an overlong line into sentences so a single giant paragraph can
// still be packed into MAX_CHUNK_CHARS-sized pieces below.
const splitLine = (line: string): string[] =>
  line.length <= MAX_CHUNK_CHARS
    ? [line]
    : line
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

// Group lines into topic sections at bullet -> non-bullet transitions.
// Bulleted documents (PDFs, feature lists, FAQs) read as
// "heading, optional intro line, bullets, next heading, bullets, ...";
// treating a non-bulleted line right after a bulleted one as a new
// section keeps each heading together with the bullets under it, instead
// of splitting them apart by an arbitrary character count or letting one
// chunk drift across two unrelated topics.
const groupIntoSections = (lines: string[]): string[][] => {
  const sections: string[][] = [];
  let current: string[] = [];
  let prevWasBullet = false;

  for (const line of lines) {
    const bullet = isBulletLine(line);
    if (!bullet && prevWasBullet && current.length > 0) {
      sections.push(current);
      current = [];
    }
    current.push(line);
    prevWasBullet = bullet;
  }
  if (current.length > 0) sections.push(current);
  return sections;
};

// Pack one section's lines into chunks of at most MAX_CHUNK_CHARS. Most
// sections are small enough to stay whole; this only splits further when a
// section runs long. Consecutive sub-chunks repeat the last line so context
// carries forward instead of being cut mid-thought.
const packSection = (lines: string[]): string[] => {
  const units = lines.flatMap(splitLine);
  const chunks: string[] = [];
  let current: string[] = [];
  let length = 0;

  for (const unit of units) {
    if (current.length > 0 && length + unit.length > MAX_CHUNK_CHARS) {
      chunks.push(current.join('\n'));
      const overlap = current[current.length - 1];
      current = [overlap];
      length = overlap.length;
    }
    current.push(unit);
    length += unit.length + 1;
  }
  if (current.length > 0) chunks.push(current.join('\n'));
  return chunks;
};

export const generateChunks = (input: string): string[] => {
  const lines = input
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  return groupIntoSections(lines).flatMap(packSection);
};

export const generateEmbeddings = async (
  value: string,
): Promise<{ content: string; embedding: number[] }[]> => {
  const chunks = generateChunks(value);
  const { embeddings: vectors } = await embedMany({
    model: embeddingModel,
    values: chunks,
  });
  return vectors.map((embedding, i) => ({ content: chunks[i], embedding }));
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll('\n', ' ');
  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
  });
  return embedding;
};

export const findRelevantContent = async (userQuery: string) => {
  const db = getDb();
  const userQueryEmbedded = await generateEmbedding(userQuery);
  const similarity = sql<number>`1 - (${cosineDistance(
    embeddings.embedding,
    userQueryEmbedded,
  )})`;
  const similarGuides = await db
    .select({ content: embeddings.content, similarity })
    .from(embeddings)
    .where(gt(similarity, MIN_SIMILARITY))
    .orderBy(t => desc(t.similarity))
    .limit(4);
  return similarGuides;
};
