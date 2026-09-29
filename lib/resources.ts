import 'server-only';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
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
    // Validation errors describe the user's own input, so they're safe to
    // show. Anything else (DB, embedding provider, network) is logged and
    // hidden behind a generic message so internals never reach the client.
    if (error instanceof z.ZodError) {
      return error.issues[0]?.message ?? 'Please enter some content.';
    }

    console.error('createResource failed', { userId, error });
    return "We couldn't save that resource. Please try again.";
  }
};
