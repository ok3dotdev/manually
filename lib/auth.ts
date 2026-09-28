import { auth } from '@clerk/nextjs/server';

export class UnauthorizedError extends Error {
  constructor() {
    super('You need to be signed in to do that.');
  }
}

// The only way server code should learn who the caller is. Never accept a
// user id from the client — server actions and route handlers are public
// endpoints, so anything they receive can be forged.
export async function requireUserId() {
  const { userId } = await auth();
  if (!userId) throw new UnauthorizedError();
  return userId;
}
