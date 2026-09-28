import Link from 'next/link';

export function Landing() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-8 px-4 pb-24 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(circle, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 65%)',
        }}
      />
      <div className="max-w-md space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          Chat with your appliance manuals
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Upload the manuals that came with your place and ask them questions
          instead of digging through PDFs. Your documents stay private to your
          account.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/sign-in"
          className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900"
        >
          Sign in
        </Link>
        <Link
          href="/sign-up"
          className="rounded-full border border-zinc-300 bg-white/80 px-5 py-2 text-sm font-medium text-zinc-700 transition-colors duration-200 hover:border-zinc-400 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:text-white"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}
