import { motion } from 'framer-motion';
import { SuggestionButtons } from './suggestion-buttons';

export function EmptyState({
  onSelectSuggestion,
}: {
  onSelectSuggestion: (suggestion: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-32 text-center"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <motion.div
          className="absolute left-1/2 top-1/2 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 65%)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--accent) 20%, transparent) 0%, transparent 70%)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.15 }}
        />
      </div>
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
      <SuggestionButtons onSelect={onSelectSuggestion} />
    </motion.div>
  );
}
