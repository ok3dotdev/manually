'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { deleteResource } from '@/lib/actions/resources';
import { ResourceContent } from './resource-content';

type Resource = {
  id: string;
  content: string;
  sourceType: string;
  fileName: string | null;
  fileSize: number | null;
};

const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${unitIndex === 0 ? value : value.toFixed(1)} ${units[unitIndex]}`;
};

const listVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15 } },
};

export function ResourceTabs({
  notes,
  files,
}: {
  notes: Resource[];
  files: Resource[];
}) {
  const [tab, setTab] = useState<'notes' | 'files'>(
    notes.length === 0 && files.length > 0 ? 'files' : 'notes',
  );

  if (notes.length === 0 && files.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No resources yet. Add one above.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="inline-flex w-fit items-center gap-1 rounded-full border border-zinc-200 bg-white/80 p-1 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        {(
          [
            { key: 'notes', label: 'Notes', count: notes.length },
            { key: 'files', label: 'Files', count: files.length },
          ] as const
        ).map(item => (
          <motion.button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            whileTap={{ scale: 0.96 }}
            className={
              'relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ' +
              (tab === item.key
                ? 'text-white'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white')
            }
          >
            {tab === item.key && (
              <motion.span
                layoutId="resource-tab-pill"
                className="absolute inset-0 rounded-full bg-accent shadow-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10">
              {item.label}
              <span
                className={
                  'ml-1.5 text-xs ' +
                  (tab === item.key
                    ? 'text-white/80'
                    : 'text-zinc-400 dark:text-zinc-500')
                }
              >
                {item.count}
              </span>
            </span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {tab === 'notes' ? (
          <motion.div
            key="notes"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {notes.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No notes yet.
              </p>
            ) : (
              <motion.ul
                variants={listVariants}
                initial="hidden"
                animate="show"
                className="flex flex-col gap-2"
              >
                <AnimatePresence>
                  {notes.map(resource => (
                    <motion.li
                      key={resource.id}
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
                  ))}
                </AnimatePresence>
              </motion.ul>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="files"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {files.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No files yet.
              </p>
            ) : (
              <motion.ul
                variants={listVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 gap-3 sm:grid-cols-3"
              >
                <AnimatePresence>
                  {files.map(resource => (
                    <motion.li
                      key={resource.id}
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
                  ))}
                </AnimatePresence>
              </motion.ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
