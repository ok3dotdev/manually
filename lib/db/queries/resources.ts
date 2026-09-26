import { desc } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { resources } from '@/lib/db/schema/resources';

export async function getResources() {
  const db = getDb();
  return db.select().from(resources).orderBy(desc(resources.createdAt));
}
