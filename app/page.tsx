'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { RagAgentUIMessage } from '@/lib/agents/rag-agent';

const listVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

const SUGGESTIONS = [
  'My dishwasher is showing error code E15, what do I do?',
  'How often should I change the thermostat filter?',
  "What's in your knowledge base?",
];

export default function Home() {
  const { messages, sendMessage, status } = useChat<RagAgentUIMessage>({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="relative flex flex-1 flex-col bg-white/70 dark:bg-zinc-900/40">
      {messages.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-32 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="space-y-1"
          >
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
              How can I help?
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Ask a question or teach me something new.
            </p>
          </motion.div>
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="show"
            className="flex max-w-2xl flex-wrap justify-center gap-2"
          >
            {SUGGESTIONS.map(suggestion => (
              <motion.button
                key={suggestion}
                variants={itemVariants}
                type="button"
                onClick={() => sendMessage({ text: suggestion })}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600 transition-colors duration-200 hover:border-accent/40 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-accent"
              >
                {suggestion}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>
      ) : (
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 overflow-y-auto px-4 pt-8 pb-32">
          <AnimatePresence initial={false}>
            {messages.map(message => (
              <motion.div
                key={message.id}
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
                      const isDone = part.state === 'output-available' || part.state === 'output-error';
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-1.5 italic text-zinc-400 dark:text-zinc-500"
                        >
                          {!isDone && (
                            <span className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent dark:border-zinc-500" />
                          )}
                          {isDone
                            ? 'added resource to knowledge base'
                            : 'adding resource to knowledge base...'}
                        </div>
                      );
                    }
                    if (part.type === 'tool-getInformation') {
                      const isDone = part.state === 'output-available' || part.state === 'output-error';
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-1.5 italic text-zinc-400 dark:text-zinc-500"
                        >
                          {!isDone && (
                            <span className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent dark:border-zinc-500" />
                          )}
                          {isDone ? 'checked knowledge base' : 'checking knowledge base...'}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={endRef} />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}
        className="pointer-events-none fixed inset-x-0 bottom-0 flex justify-center px-4 pb-6"
      >
        <form
          className="pointer-events-auto flex w-full max-w-2xl gap-2 rounded-full border border-zinc-200/70 bg-white/90 p-1.5 shadow-xl shadow-accent/10 backdrop-blur-md transition-shadow duration-200 focus-within:shadow-2xl focus-within:shadow-accent/30 dark:border-zinc-800/70 dark:bg-zinc-900/90"
          onSubmit={e => {
            e.preventDefault();
            if (input.trim()) {
              sendMessage({ text: input });
              setInput('');
            }
          }}
        >
          <input
            className="flex-1 rounded-full bg-transparent px-4 py-2 text-sm text-black focus:outline-none dark:text-white"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={status !== 'ready'}
            placeholder="Ask a question or teach me something..."
          />
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 disabled:opacity-50 dark:focus-visible:ring-offset-zinc-900"
            type="submit"
            disabled={status !== 'ready'}
          >
            Send
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
