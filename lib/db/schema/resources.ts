import { sql } from 'drizzle-orm';
import { index, text, varchar, integer, timestamp, pgTable } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { z } from 'zod';

export const resources = pgTable(
  'resources',
  {
    id: varchar('id', { length: 191 })
      .primaryKey()
      .$defaultFn(() => nanoid()),
    // Clerk user id of the owner. Every read and write is scoped by it.
    userId: varchar('user_id', { length: 191 }).notNull(),
    content: text('content').notNull(),
    sourceType: varchar('source_type', { length: 16 }).notNull().default('text'),
    fileName: text('file_name'),
    fileUrl: text('file_url'),
    mimeType: varchar('mime_type', { length: 128 }),
    pageCount: integer('page_count'),
    fileSize: integer('file_size'),
    createdAt: timestamp('created_at').notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
  },
  table => [index('resources_user_id_idx').on(table.userId)],
);

export const insertResourceSchema = z.object({
  content: z.string().min(1),
});

export type NewResourceParams = z.infer<typeof insertResourceSchema>;
