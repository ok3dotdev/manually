import { tool } from 'ai';
import { z } from 'zod';
import { findRelevantContent } from '@/lib/ai/embedding';

export const getInformationTool = tool({
  description: `get information from your knowledge base to answer questions.`,
  inputSchema: z.object({
    question: z.string().describe('the users question'),
  }),
  // Supplied by the server per request, never by the model.
  contextSchema: z.object({ userId: z.string() }),
  execute: async ({ question }, { context }) =>
    findRelevantContent(context.userId, question),
});
