import { auth } from '@clerk/nextjs/server';
import { getResources } from '@/lib/db/queries/resources';
import { AddResourceForm } from './components/add-resource-form';
import { ResourceTabs } from './components/resource-tabs';

export default async function KnowledgePage() {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();

  const items = await getResources(userId);
  const notes = items.filter(resource => resource.sourceType !== 'pdf');
  const files = items.filter(resource => resource.sourceType === 'pdf');

  return (
    <div className="flex flex-col flex-1 items-center font-sans">
      <div className="flex w-full max-w-2xl flex-1 flex-col gap-6 py-8 px-4">
        <h1 className="text-lg font-semibold text-black dark:text-white">
          Knowledge Base
        </h1>

        <AddResourceForm />

        <ResourceTabs notes={notes} files={files} />
      </div>
    </div>
  );
}
