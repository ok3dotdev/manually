import { extractText, getDocumentProxy } from 'unpdf';

// Must stay below serverActions.bodySizeLimit in next.config.ts.
export const MAX_PDF_SIZE_BYTES = 4 * 1024 * 1024;

export const extractPdfText = async (
  data: ArrayBuffer,
): Promise<{ text: string; pageCount: number }> => {
  const pdf = await getDocumentProxy(new Uint8Array(data));
  const { text, totalPages } = await extractText(pdf, { mergePages: true });
  return { text, pageCount: totalPages };
};
