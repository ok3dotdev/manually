import { auth } from '@clerk/nextjs/server';
import { createAgentUIStreamResponse } from 'ai';
import { createRagAgent } from '@/lib/agents/rag-agent';

export const maxDuration = 30;

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { messages } = await request.json();

  return createAgentUIStreamResponse({
    agent: createRagAgent(userId),
    uiMessages: messages,
  });
}
