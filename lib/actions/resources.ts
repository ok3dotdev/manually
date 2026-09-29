'use server';

import { del, put } from '@vercel/blob';
import { nanoid } from 'nanoid';
import { revalidatePath } from 'next/cache';
import { UnauthorizedError, requireUserId } from '@/lib/auth';
import { MAX_PDF_SIZE_BYTES, extractPdfText } from '@/lib/ai/pdf';
import { storeEmbeddings } from '@/lib/db/queries/embeddings';
import {
  createPdfResource,
  deleteResourceById,
} from '@/lib/db/queries/resources';
import { createResource } from '@/lib/resources';

export const addResourceAction = async (
  _prevState: { message: string },
  formData: FormData,
) => {
  try {
    const userId = await requireUserId();
    const content = formData.get('content');
    const message = await createResource(userId, {
      content: typeof content === 'string' ? content : '',
    });
    return { message };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { message: error.message };
    }
    console.error('addResourceAction failed', error);
    return { message: 'Something went wrong. Please try again.' };
  }
};

export const addPdfResourceAction = async (
  _prevState: { message: string },
  formData: FormData,
) => {
  try {
    const userId = await requireUserId();
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

    const blob = await put(`pdfs/${userId}/${nanoid()}-${file.name}`, buffer, {
      access: 'private',
      contentType: 'application/pdf',
    });

    const resource = await createPdfResource({
      userId,
      content: text,
      fileName: file.name,
      fileUrl: blob.url,
      mimeType: file.type,
      pageCount,
      fileSize: file.size,
    });

    await storeEmbeddings(userId, resource.id, text);

    revalidatePath('/knowledge');
    return { message: `"${file.name}" uploaded and embedded.` };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { message: error.message };
    }
    console.error('addPdfResourceAction failed', error);
    return { message: "We couldn't upload that file. Please try again." };
  }
};

export const deleteResource = async (id: string) => {
  const userId = await requireUserId();
  // Scoped by owner, so someone else's id is a no-op rather than a delete.
  const resource = await deleteResourceById(userId, id);

  if (resource?.fileUrl) {
    await del(resource.fileUrl);
  }

  revalidatePath('/knowledge');
};
