import 'server-only';

import { revalidatePath } from 'next/cache';
import { storeEmbeddings } from '@/lib/db/queries/embeddings';
import { createTextResource } from '@/lib/db/queries/resources';
import { insertResourceSchema, type NewResourceParams } from '@/lib/db/schema/resources';

// Shared by the add-note form action and the chat agent's addResource tool.
// Lives outside lib/actions because it takes a userId argument: exported from
// a 'use server' file it would become a public endpoint that trusts that id.
export const createResource = async (
  userId: string,
  input: NewResourceParams,
) => {
  try {
    const { content } = insertResourceSchema.parse(input);
    const resource = await createTextResource(userId, content);
    await storeEmbeddings(userId, resource.id, content);

    revalidatePath('/knowledge');
    return 'Resource successfully created and embedded.';
  } catch (error) {
    return error instanceof Error && error.message.length > 0
      ? error.message
      : 'Error, please try again.';
  }
};
