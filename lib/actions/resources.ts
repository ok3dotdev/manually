'use server';

import { del, put } from '@vercel/blob';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db';
import { generateEmbeddings } from '@/lib/ai/embedding';
import { MAX_PDF_SIZE_BYTES, extractPdfText } from '@/lib/ai/pdf';
import { embeddings as embeddingsTable } from '@/lib/db/schema/embeddings';
import {
  insertResourceSchema,
  resources,
  type NewResourceParams,
} from '@/lib/db/schema/resources';

const embedAndStore = async (resourceId: string, content: string) => {
  const db = getDb();
  const generatedEmbeddings = await generateEmbeddings(content);
  await db.insert(embeddingsTable).values(
    generatedEmbeddings.map(embedding => ({
      resourceId,
      ...embedding,
    })),
  );
};

export const createResource = async (input: NewResourceParams) => {
  try {
    const { content } = insertResourceSchema.parse(input);
    const db = getDb();

    const [resource] = await db
      .insert(resources)
      .values({ content })
      .returning();

    await embedAndStore(resource.id, content);

    revalidatePath('/knowledge');
    return 'Resource successfully created and embedded.';
  } catch (error) {
    return error instanceof Error && error.message.length > 0
      ? error.message
      : 'Error, please try again.';
  }
};

export const addResourceAction = async (
  _prevState: { message: string },
  formData: FormData,
) => {
  const content = formData.get('content');
  const message = await createResource({
    content: typeof content === 'string' ? content : '',
  });
  return { message };
};

export const addPdfResourceAction = async (
  _prevState: { message: string },
  formData: FormData,
) => {
  try {
    const file = formData.get('file');

    if (!(file instanceof File) || file.size === 0) {
      return { message: 'Please choose a PDF file.' };
    }
    if (file.type !== 'application/pdf') {
      return { message: 'Only PDF files are supported.' };
    }
    if (file.size > MAX_PDF_SIZE_BYTES) {
      return { message: 'PDF is too large (max 20MB).' };
    }

    const buffer = await file.arrayBuffer();
    // extractPdfText's underlying worker detaches its input buffer, so it
    // must run on a copy — the original is still needed below for put().
    const { text, pageCount } = await extractPdfText(buffer.slice(0));

    if (text.trim().length === 0) {
      return {
        message: 'Could not find any text in that PDF (is it scanned?).',
      };
    }

    const blob = await put(`pdfs/${nanoid()}-${file.name}`, buffer, {
      access: 'private',
      contentType: 'application/pdf',
    });

    const db = getDb();
    const [resource] = await db
      .insert(resources)
      .values({
        content: text,
        sourceType: 'pdf',
        fileName: file.name,
        fileUrl: blob.url,
        mimeType: file.type,
        pageCount,
        fileSize: file.size,
      })
      .returning();

    await embedAndStore(resource.id, text);

    revalidatePath('/knowledge');
    return { message: `"${file.name}" uploaded and embedded.` };
  } catch (error) {
    return {
      message:
        error instanceof Error && error.message.length > 0
          ? error.message
          : 'Error, please try again.',
    };
  }
};

export const deleteResource = async (id: string) => {
  const db = getDb();
  const [resource] = await db
    .delete(resources)
    .where(eq(resources.id, id))
    .returning();

  if (resource?.fileUrl) {
    await del(resource.fileUrl);
  }

  revalidatePath('/knowledge');
};
