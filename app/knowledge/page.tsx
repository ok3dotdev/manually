import { getResources } from '@/lib/db/queries/resources';
import { deleteResource } from '@/lib/actions/resources';
import { AddResourceForm } from './add-resource-form';
import { ResourceContent } from './resource-content';

export default async function KnowledgePage() {
  const items = await getResources();

  return (
    <div className="flex flex-col flex-1 items-center font-sans">
      <div className="flex w-full max-w-2xl flex-1 flex-col gap-6 py-8 px-4">
        <h1 className="text-lg font-semibold text-black dark:text-white">
          Knowledge Base
        </h1>

        <AddResourceForm />

        <ul className="flex flex-col gap-2">
          {items.length === 0 && (
            <li className="text-sm text-zinc-500 dark:text-zinc-400">
              No resources yet. Add one above.
            </li>
          )}
          {items.map(resource => (
            <li
              key={resource.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-zinc-200/70 bg-white/70 px-4 py-3 text-sm shadow-sm backdrop-blur-sm dark:border-zinc-800/70 dark:bg-zinc-900/40"
            >
              <div className="flex flex-col gap-1">
                {resource.sourceType === 'pdf' && (
                  <span className="inline-flex w-fit items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    PDF
                    {resource.pageCount != null &&
                      ` · ${resource.pageCount}p`}
                  </span>
                )}
                {resource.fileName && (
                  <a
                    href={`/api/resources/${resource.id}/file`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded text-xs font-medium text-zinc-500 transition-colors hover:text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 dark:text-zinc-400"
                  >
                    {resource.fileName}
                  </a>
                )}
                <ResourceContent content={resource.content} />
              </div>
              <form action={deleteResource.bind(null, resource.id)}>
                <button
                  type="submit"
                  className="shrink-0 rounded text-xs font-medium text-zinc-400 transition-colors hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
                >
                  Delete
                </button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
