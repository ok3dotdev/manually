import { and, desc, eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { resources } from '@/lib/db/schema/resources';

export async function getResources(userId: string) {
  const db = getDb();
  return db
    .select()
    .from(resources)
    .where(eq(resources.userId, userId))
    .orderBy(desc(resources.createdAt));
}

export async function getResourceById(userId: string, id: string) {
  const db = getDb();
  const [resource] = await db
    .select()
    .from(resources)
    .where(and(eq(resources.id, id), eq(resources.userId, userId)))
    .limit(1);
  return resource;
}

export async function createTextResource(userId: string, content: string) {
  const db = getDb();
  const [resource] = await db
    .insert(resources)
    .values({ userId, content })
    .returning();
  return resource;
}

export async function createPdfResource(params: {
  userId: string;
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

export async function deleteResourceById(userId: string, id: string) {
  const db = getDb();
  const [resource] = await db
    .delete(resources)
    .where(and(eq(resources.id, id), eq(resources.userId, userId)))
    .returning();
  return resource;
}
