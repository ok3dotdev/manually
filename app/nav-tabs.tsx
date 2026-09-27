'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/', label: 'Chat' },
  { href: '/knowledge', label: 'Knowledge Base' },
];

export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="relative flex items-center justify-center gap-4 py-4">
      <span className="absolute left-4 text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">
        Manually
      </span>
      <div className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white/80 p-1 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        {tabs.map(tab => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ' +
                (active
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white')
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
