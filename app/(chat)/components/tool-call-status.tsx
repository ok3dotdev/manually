import { Spinner } from '@/components/ui/spinner';

export function ToolCallStatus({
  done,
  pendingLabel,
  doneLabel,
}: {
  done: boolean;
  pendingLabel: string;
  doneLabel: string;
}) {
  return (
    <div className="flex items-center gap-1.5 italic text-zinc-400 dark:text-zinc-500">
      {!done && <Spinner />}
      {done ? doneLabel : pendingLabel}
    </div>
  );
}
