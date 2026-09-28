import { clerkMiddleware } from '@clerk/nextjs/server';

// Only establishes the Clerk session for each request. Access control lives
// next to the data (pages, route handlers, server actions), per Clerk's
// guidance for Next.js 16.
export default clerkMiddleware({
  signInUrl: '/sign-in',
  signUpUrl: '/sign-up',
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
};
