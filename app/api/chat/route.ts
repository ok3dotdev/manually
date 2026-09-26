import { createAgentUIStreamResponse } from 'ai';
import { ragAgent } from '@/lib/agents/rag-agent';

export const maxDuration = 30;

export async function POST(request: Request) {
  const { messages } = await request.json();

  return createAgentUIStreamResponse({
    agent: ragAgent,
    uiMessages: messages,
  });
}
