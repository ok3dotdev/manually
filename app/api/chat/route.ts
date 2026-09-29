import { auth } from '@clerk/nextjs/server';
import { createAgentUIStreamResponse } from 'ai';
import { createRagAgent } from '@/lib/agents/rag-agent';
import { isRateLimited } from '@/lib/rate-limit';

export const maxDuration = 30;

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (isRateLimited(userId)) {
    return new Response('Too many requests. Please slow down.', { status: 429 });
  }

  const { messages } = await request.json();

  return createAgentUIStreamResponse({
    agent: createRagAgent(userId),
    uiMessages: messages,
  });
}
