import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { env } from '../env';
import * as schema from './schema/resources';
import * as embeddingsSchema from './schema/embeddings';

function createDb() {
  const sql = neon(env.DATABASE_URL);
  return drizzle(sql, { schema: { ...schema, ...embeddingsSchema } });
}

let _db: ReturnType<typeof createDb> | null = null;

export function getDb() {
  if (!_db) _db = createDb();
  return _db;
}
