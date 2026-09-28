import { motion } from 'framer-motion';

const SUGGESTIONS = [
  'My dishwasher is showing error code E15, what do I do?',
  'How often should I change the thermostat filter?',
  "What's in your knowledge base?",
];

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

export function SuggestionButtons({
  onSelect,
}: {
  onSelect: (suggestion: string) => void;
}) {
  return (
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
          onClick={() => onSelect(suggestion)}
          whileTap={{ scale: 0.97 }}
          className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600 transition-colors duration-200 hover:border-accent/40 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-accent"
        >
          {suggestion}
        </motion.button>
      ))}
    </motion.div>
  );
}
