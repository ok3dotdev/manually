import { InferAgentUIMessage, ToolLoopAgent } from 'ai';
import { addResourceTool } from '@/lib/tools/add-resource-tool';
import { getInformationTool } from '@/lib/tools/get-information-tool';

export const ragAgent = new ToolLoopAgent({
  model: 'openai/gpt-4o-mini',
  instructions: `You are a helpful assistant. Check your knowledge base before answering any questions.
    Only respond to questions using information from tool calls.
    If no relevant information is found in the tool calls, respond, "Sorry, I don't know."`,
  tools: {
    addResource: addResourceTool,
    getInformation: getInformationTool,
  },
});

export type RagAgentUIMessage = InferAgentUIMessage<typeof ragAgent>;
