import { auth } from '@clerk/nextjs/server';
import { get } from '@vercel/blob';
import { getResourceById } from '@/lib/db/queries/resources';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { id } = await params;
  // Another user's file is a 404, not a 403, so ids can't be probed.
  const resource = await getResourceById(userId, id);

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
