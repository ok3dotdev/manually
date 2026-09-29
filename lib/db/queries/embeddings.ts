import { getDb } from '@/lib/db';
import { generateEmbeddings } from '@/lib/ai/embedding';
import { embeddings as embeddingsTable } from '@/lib/db/schema/embeddings';

export async function storeEmbeddings(
  userId: string,
  resourceId: string,
  content: string,
) {
  const db = getDb();
  const generatedEmbeddings = await generateEmbeddings(content);
  await db.insert(embeddingsTable).values(
    generatedEmbeddings.map(embedding => ({
      userId,
      resourceId,
      ...embedding,
    })),
  );
}
