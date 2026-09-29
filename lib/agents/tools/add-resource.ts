import { tool } from 'ai';
import { z } from 'zod';
import { createResource } from '@/lib/resources';

export const addResourceTool = tool({
  description: `add a resource to your knowledge base.
    If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
  inputSchema: z.object({
    content: z
      .string()
      .describe('the content or resource to add to the knowledge base'),
  }),
  // Supplied by the server per request, never by the model.
  contextSchema: z.object({ userId: z.string() }),
  execute: async ({ content }, { context }) =>
    createResource(context.userId, { content }),
});
