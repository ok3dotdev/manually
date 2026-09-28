import { motion } from 'framer-motion';

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  return (
    <form
      className="pointer-events-auto flex w-full max-w-2xl gap-2 rounded-full border border-zinc-200/70 bg-white/90 p-1.5 shadow-xl shadow-accent/10 backdrop-blur-md transition-shadow duration-200 focus-within:shadow-2xl focus-within:shadow-accent/30 dark:border-zinc-800/70 dark:bg-zinc-900/90"
      onSubmit={e => {
        e.preventDefault();
        if (value.trim()) onSubmit();
      }}
    >
      <input
        className="flex-1 rounded-full bg-transparent px-4 py-2 text-sm text-black focus:outline-none dark:text-white"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Ask a question or teach me something..."
      />
      <motion.button
        whileTap={{ scale: 0.95 }}
        className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 disabled:opacity-50 dark:focus-visible:ring-offset-zinc-900"
        type="submit"
        disabled={disabled}
      >
        Send
      </motion.button>
    </form>
  );
}
