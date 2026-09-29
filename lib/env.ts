import { z } from 'zod';

// Clerk and @vercel/blob already validate their own env vars the moment
// they're used, throwing clear, specific errors — so we don't duplicate
// that here (confirmed by reading their installed source, not just docs):
//   - CLERK_SECRET_KEY: `@clerk/backend` (used by `auth()` /
//     `clerkMiddleware()`) throws "Missing secretKey. Provide it in
//     options or set CLERK_SECRET_KEY environment variable."
//   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: `@clerk/nextjs`'s `ClerkProvider`
//     and `clerkMiddleware()` throw "Clerk keys are missing from your
//     environment." with setup guidance.
//   - BLOB_READ_WRITE_TOKEN: `@vercel/blob` throws "No read-write token
//     found. Either configure the BLOB_READ_WRITE_TOKEN environment
//     variable, or pass a `token` option to your calls."
// DATABASE_URL has no such guard (it's read via a bare `!` non-null
// assertion in lib/db/index.ts), so it's the one var we validate here.
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const { fieldErrors } = parsed.error.flatten();
    const details = Object.entries(fieldErrors)
      .map(([key, messages]) => `  - ${key}: ${messages?.join(', ') ?? 'invalid'}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${details}`);
  }
  return parsed.data;
}

export const env = loadEnv();
