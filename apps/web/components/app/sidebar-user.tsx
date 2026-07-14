'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

function SidebarUserSkeleton() {
  return (
    <div className="flex items-center gap-2 rounded-lg px-2 py-2">
      <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="h-3 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-2.5 w-14 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

export function SidebarUser() {
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  if (!clerkEnabled) {
    return (
      <Link
        className="flex items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
        href="/settings"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
          A
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">Account</p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Free plan</p>
        </div>
      </Link>
    );
  }

  const { user, isLoaded } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? 'Account';
  const initial =
    user?.firstName?.charAt(0)?.toUpperCase() ??
    user?.emailAddresses[0]?.emailAddress?.charAt(0)?.toUpperCase() ??
    'A';

  if (!isLoaded) {
    return <SidebarUserSkeleton />;
  }

  return (
    <Link
      className="flex items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
      href="/settings"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">{email}</p>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Free plan</p>
      </div>
    </Link>
  );
}
