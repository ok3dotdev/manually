import { nanoid } from 'nanoid';
import { index, pgTable, text, varchar, vector } from 'drizzle-orm/pg-core';
import { resources } from './resources';

export const embeddings = pgTable(
  'embeddings',
  {
    id: varchar('id', { length: 191 })
      .primaryKey()
      .$defaultFn(() => nanoid()),
    resourceId: varchar('resource_id', { length: 191 }).references(
      () => resources.id,
      { onDelete: 'cascade' },
    ),
    // Copied from the parent resource so similarity search can filter by
    // owner without a join.
    userId: varchar('user_id', { length: 191 }).notNull(),
    content: text('content').notNull(),
    // Statute structure, set when the source is chunked as legislation.
    // Null for ordinary documents.
    citation: varchar('citation', { length: 64 }), // "s. 26(3)"
    section: varchar('section', { length: 16 }), // "26"
    subsection: varchar('subsection', { length: 16 }), // "3"
    heading: text('heading'),
    embedding: vector('embedding', { dimensions: 1536 }).notNull(),
  },
  table => [
    index('embeddingIndex').using(
      'hnsw',
      table.embedding.op('vector_cosine_ops'),
    ),
    index('embeddings_user_id_idx').on(table.userId),
  ],
);
