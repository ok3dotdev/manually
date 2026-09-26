import { tool } from 'ai';
import { z } from 'zod';
import { createResource } from '@/lib/actions/resources';

export const addResourceTool = tool({
  description: `add a resource to your knowledge base.
    If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
  inputSchema: z.object({
    content: z
      .string()
      .describe('the content or resource to add to the knowledge base'),
  }),
  execute: async ({ content }) => createResource({ content }),
});
