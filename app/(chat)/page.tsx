'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { RagAgentUIMessage } from '@/lib/agents/rag-agent';
import { ChatInput } from './components/chat-input';
import { ChatMessage } from './components/chat-message';
import { EmptyState } from './components/empty-state';

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
        <EmptyState
          onSelectSuggestion={suggestion => sendMessage({ text: suggestion })}
        />
      ) : (
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 overflow-y-auto px-4 pt-8 pb-32">
          <AnimatePresence initial={false}>
            {messages.map(message => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </AnimatePresence>
          <div ref={endRef} />
        </div>
      )}

      <div className="pointer-events-none fixed inset-x-0 bottom-0 flex justify-center px-4 pb-6">
        <ChatInput
          value={input}
          onChange={setInput}
          disabled={status !== 'ready'}
          onSubmit={() => {
            sendMessage({ text: input });
            setInput('');
          }}
        />
      </div>
    </div>
  );
}
