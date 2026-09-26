import { eq } from 'drizzle-orm';
import { get } from '@vercel/blob';
import { getDb } from '@/lib/db';
import { resources } from '@/lib/db/schema/resources';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getDb();
  const [resource] = await db
    .select()
    .from(resources)
    .where(eq(resources.id, id))
    .limit(1);

  if (!resource?.fileUrl) {
    return new Response('Not found', { status: 404 });
  }

  const blob = await get(resource.fileUrl, { access: 'private' });
  if (!blob || blob.statusCode !== 200) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(blob.stream, {
    headers: {
      'Content-Type': blob.blob.contentType,
      'Content-Disposition': `inline; filename="${resource.fileName ?? 'document.pdf'}"`,
    },
  });
}
