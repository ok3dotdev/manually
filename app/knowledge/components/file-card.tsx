import { motion } from 'framer-motion';
import { deleteResource } from '@/lib/actions/resources';
import { formatFileSize } from '@/lib/utils/format';
import { itemVariants } from './list-variants';

export function FileCard({
  resource,
}: {
  resource: { id: string; fileName: string | null; fileSize: number | null };
}) {
  return (
    <motion.li
      variants={itemVariants}
      exit="exit"
      layout
      whileHover={{ y: -2 }}
      className="group relative flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 text-center shadow-sm transition-colors duration-200 hover:border-accent/40 dark:border-zinc-800 dark:bg-zinc-900/60"
    >
      <span
        aria-hidden="true"
        className="absolute right-2 top-2 h-3 w-3 rounded-sm bg-zinc-200/80 dark:bg-zinc-700/60"
        style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
      />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="h-6 w-6 shrink-0 text-zinc-400 transition-colors duration-200 group-hover:text-accent dark:text-zinc-500"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        />
      </svg>
      <a
        href={`/api/resources/${resource.id}/file`}
        target="_blank"
        rel="noopener noreferrer"
        className="line-clamp-2 break-words px-1 text-xs font-medium text-zinc-600 hover:text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 dark:text-zinc-300"
      >
        {resource.fileName ?? 'Untitled file'}
      </a>
      {resource.fileSize != null && (
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
          {formatFileSize(resource.fileSize)}
        </span>
      )}
      <form
        action={deleteResource.bind(null, resource.id)}
        className="absolute bottom-2.5 right-2.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      >
        <button
          type="submit"
          className="rounded text-[10px] font-medium text-zinc-400 transition-colors hover:text-red-500 focus-visible:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-red-500/50"
        >
          Delete
        </button>
      </form>
    </motion.li>
  );
}
