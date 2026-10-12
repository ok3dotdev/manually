import { InferAgentUIMessage, ToolLoopAgent } from 'ai';
import { addResourceTool } from '@/lib/agents/tools/add-resource';
import { getInformationTool } from '@/lib/agents/tools/get-information';

// Built per request so the tools are bound to the signed-in user. The user id
// reaches them through toolsContext rather than the prompt, so the model
// can't be talked into reading or writing someone else's knowledge base.
export const createRagAgent = (userId: string) =>
  new ToolLoopAgent({
    model: 'openai/gpt-4o-mini',
    instructions: `You are an assistant for Ontario residential tenancy questions, answering from the user's knowledge base: the Residential Tenancies Act, 2006 and other documents they have uploaded, plus facts they have shared about their own tenancy.
    Greetings, thanks, and questions about what you can do may be answered directly. Everything else must be looked up with getInformation first and answered only from what it returns — never from general knowledge, including general knowledge of Ontario law.
    Cite the document and section (e.g. "RTA s. 47") for each point if possible. Be concise, use plain language, and quote the exact wording when a deadline, notice period, or amount matters.
    If the results don't cover the question, say "I couldn't find that in your documents." and stop.
    You provide legal information, not legal advice; for a dispute or a decision with real consequences, suggest the Landlord and Tenant Board or a legal clinic.`,
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
