import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { resources } from '@/lib/db/schema/resources';

export async function getResources() {
  const db = getDb();
  return db.select().from(resources).orderBy(desc(resources.createdAt));
}

export async function createTextResource(content: string) {
  const db = getDb();
  const [resource] = await db.insert(resources).values({ content }).returning();
  return resource;
}

export async function createPdfResource(params: {
  content: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  pageCount: number;
  fileSize: number;
}) {
  const db = getDb();
  const [resource] = await db
    .insert(resources)
    .values({ ...params, sourceType: 'pdf' })
    .returning();
  return resource;
}

export async function deleteResourceById(id: string) {
  const db = getDb();
  const [resource] = await db
    .delete(resources)
    .where(eq(resources.id, id))
    .returning();
  return resource;
}
