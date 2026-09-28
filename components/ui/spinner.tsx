const SIZES = {
  sm: 'h-3 w-3 border-2',
  md: 'h-4 w-4 border-2',
} as const;

export function Spinner({ size = 'sm' }: { size?: keyof typeof SIZES }) {
  return (
    <span
      aria-hidden="true"
      className={`shrink-0 animate-spin rounded-full border-zinc-400 border-t-transparent dark:border-zinc-500 ${SIZES[size]}`}
    />
  );
}
