import { motion } from 'framer-motion';
import type { RagAgentUIMessage } from '@/lib/agents/rag-agent';
import { ToolCallStatus } from './tool-call-status';

const isToolDone = (state: string) =>
  state === 'output-available' || state === 'output-error';

export function ChatMessage({ message }: { message: RagAgentUIMessage }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={message.role === 'user' ? 'text-right' : 'text-left'}
    >
      <span className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {message.role === 'user' ? 'You' : 'Assistant'}
      </span>
      <div
        className={
          'inline-block max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ' +
          (message.role === 'user'
            ? 'bg-accent text-white'
            : 'bg-white text-black shadow-sm dark:bg-zinc-900 dark:text-white')
        }
      >
        {message.parts.map((part, index) => {
          if (part.type === 'text') {
            return <span key={index}>{part.text}</span>;
          }
          if (part.type === 'tool-addResource') {
            return (
              <ToolCallStatus
                key={index}
                done={isToolDone(part.state)}
                pendingLabel="adding resource to knowledge base..."
                doneLabel="added resource to knowledge base"
              />
            );
          }
          if (part.type === 'tool-getInformation') {
            return (
              <ToolCallStatus
                key={index}
                done={isToolDone(part.state)}
                pendingLabel="checking knowledge base..."
                doneLabel="checked knowledge base"
              />
            );
          }
          return null;
        })}
      </div>
    </motion.div>
  );
}
