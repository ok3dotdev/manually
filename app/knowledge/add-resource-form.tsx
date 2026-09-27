'use client';

import { useActionState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { addResourceAction, addPdfResourceAction } from '@/lib/actions/resources';

const initialState = { message: '' };

export function AddResourceForm() {
  const [state, formAction, isPending] = useActionState(
    addResourceAction,
    initialState,
  );
  const [pdfState, pdfFormAction, isPdfPending] = useActionState(
    addPdfResourceAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.message === 'Resource successfully created and embedded.') {
      formRef.current?.reset();
    }
  }, [state.message]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const formData = new FormData();
    formData.set('file', file);
    pdfFormAction(formData);
  };

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <textarea
        name="content"
        required
        rows={3}
        placeholder="Add a fact to the knowledge base..."
        className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-black transition-colors duration-200 focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
      />
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.96 }}
          type="submit"
          disabled={isPending}
          className="self-start rounded-full bg-accent px-5 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 disabled:opacity-50 dark:focus-visible:ring-offset-zinc-900"
        >
          {isPending ? 'Adding...' : 'Add'}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.94 }}
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPdfPending}
          aria-label="Attach a PDF"
          title="Attach a PDF"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-300 text-zinc-500 transition-colors duration-200 hover:border-accent/40 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400"
        >
          {isPdfPending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
              />
            </svg>
          )}
        </motion.button>
        <input
          ref={fileInputRef}
          type="file"
          name="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        {state.message && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {state.message}
          </p>
        )}
        {pdfState.message && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {pdfState.message}
          </p>
        )}
      </div>
    </form>
  );
}
