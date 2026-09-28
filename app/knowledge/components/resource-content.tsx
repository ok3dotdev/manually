'use client';

import { useState } from 'react';

const PREVIEW_LENGTH = 200;

export function ResourceContent({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = content.length > PREVIEW_LENGTH;
  const preview = isLong
    ? content.slice(0, PREVIEW_LENGTH).trimEnd()
    : content;

  return (
    <p className="whitespace-pre-wrap text-black dark:text-white">
      {expanded || !isLong ? content : `${preview}…`}
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="ml-1 text-xs font-medium text-zinc-500 hover:underline dark:text-zinc-400"
        >
          {expanded ? 'less' : 'more'}
        </button>
      )}
    </p>
  );
}
