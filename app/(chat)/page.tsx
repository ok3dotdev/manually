import { auth } from '@clerk/nextjs/server';
import { Chat } from './components/chat';
import { Landing } from './components/landing';

export default async function Home() {
  const { userId } = await auth();
  return userId ? <Chat /> : <Landing />;
}
