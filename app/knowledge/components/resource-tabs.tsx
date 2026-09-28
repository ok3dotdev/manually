'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileCard } from './file-card';
import { listVariants } from './list-variants';
import { NoteCard } from './note-card';

type Resource = {
  id: string;
  content: string;
  sourceType: string;
  fileName: string | null;
  fileSize: number | null;
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

      {tab === 'notes' ? (
        <motion.div
          key="notes"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
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
                  <NoteCard key={resource.id} resource={resource} />
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </motion.div>
      ) : (
        <motion.div
          key="files"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
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
                  <FileCard key={resource.id} resource={resource} />
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </motion.div>
      )}
    </div>
  );
}
