import { InferAgentUIMessage, ToolLoopAgent } from 'ai';
import { addResourceTool } from '@/lib/tools/add-resource-tool';
import { getInformationTool } from '@/lib/tools/get-information-tool';

export const ragAgent = new ToolLoopAgent({
  model: 'openai/gpt-4o-mini',
  instructions: `You are a helpful assistant backed by a knowledge base.
    You may respond directly without a tool call only for: (1) greetings and small talk (e.g. "hi", "thanks", "bye") — reply briefly and naturally; (2) meta questions about yourself as an assistant (e.g. "what can you help with", "how do you work") — explain that you answer questions using the knowledge base and can add new facts or documents to it.
    Every other question — including general-knowledge questions, definitions, and math — must be checked against the knowledge base first via a tool call, and answered using only the information returned by that tool call.
    If the tool call returns nothing relevant, respond with exactly "Sorry, I don't know." and stop there — never add an answer from your own general knowledge afterward.`,
  tools: {
    addResource: addResourceTool,
    getInformation: getInformationTool,
  },
});

export type RagAgentUIMessage = InferAgentUIMessage<typeof ragAgent>;
