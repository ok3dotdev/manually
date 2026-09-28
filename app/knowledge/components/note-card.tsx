import { motion } from 'framer-motion';
import { deleteResource } from '@/lib/actions/resources';
import { itemVariants } from './list-variants';
import { ResourceContent } from './resource-content';

export function NoteCard({
  resource,
}: {
  resource: { id: string; content: string };
}) {
  return (
    <motion.li
      variants={itemVariants}
      exit="exit"
      layout
      className="flex items-start justify-between gap-3 rounded-xl border border-zinc-200/70 bg-white/70 px-4 py-3 text-sm shadow-sm backdrop-blur-sm dark:border-zinc-800/70 dark:bg-zinc-900/40"
    >
      <ResourceContent content={resource.content} />
      <form action={deleteResource.bind(null, resource.id)}>
        <button
          type="submit"
          className="shrink-0 rounded text-xs font-medium text-zinc-400 transition-colors hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
        >
          Delete
        </button>
      </form>
    </motion.li>
  );
}
