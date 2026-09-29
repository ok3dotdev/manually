import { InferAgentUIMessage, ToolLoopAgent } from 'ai';
import { addResourceTool } from '@/lib/agents/tools/add-resource';
import { getInformationTool } from '@/lib/agents/tools/get-information';

// Built per request so the tools are bound to the signed-in user. The user id
// reaches them through toolsContext rather than the prompt, so the model
// can't be talked into reading or writing someone else's knowledge base.
export const createRagAgent = (userId: string) =>
  new ToolLoopAgent({
    model: 'openai/gpt-4o-mini',
    instructions: `You are a helpful assistant backed by a knowledge base.
    You may respond directly without a tool call only for: (1) greetings and small talk (e.g. "hi", "thanks", "bye") — reply briefly and naturally; (2) meta questions about yourself as an assistant (e.g. "what can you help with", "how do you work") — explain that you answer questions using the knowledge base and can add new facts or documents to it.
    The knowledge base is this user's own: their manuals and documents, plus facts they have told you about themselves, their home, and their preferences. So questions about the user (e.g. "what food do I like?", "what model is my dishwasher?") are answerable — look them up; never assume you can't know something personal.
    Every other question — including personal questions, general-knowledge questions, definitions, and math — must be checked against the knowledge base first via a tool call, and answered using only the information returned by that tool call.
    If the tool call returns nothing relevant, respond with exactly "Sorry, I don't know." and stop there — never add an answer from your own general knowledge afterward.`,
    tools: {
      addResource: addResourceTool,
      getInformation: getInformationTool,
    },
    toolsContext: {
      addResource: { userId },
      getInformation: { userId },
    },
  });

export type RagAgentUIMessage = InferAgentUIMessage<
  ReturnType<typeof createRagAgent>
>;
