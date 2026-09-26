import { extractText, getDocumentProxy } from 'unpdf';

export const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024;

export const extractPdfText = async (
  data: ArrayBuffer,
): Promise<{ text: string; pageCount: number }> => {
  const pdf = await getDocumentProxy(new Uint8Array(data));
  const { text, totalPages } = await extractText(pdf, { mergePages: true });
  return { text, pageCount: totalPages };
};
