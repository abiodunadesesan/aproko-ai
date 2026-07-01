'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void fetch('/api/v1/observability/errors', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        source: 'route-error-boundary',
        route: typeof window !== 'undefined' ? window.location.pathname : null,
      }),
      keepalive: true,
    });
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-950">
      <div className="max-w-md rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          We could not load this page. Try again or return to your dashboard.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button onClick={reset} type="button" variant="default">
            Try again
          </Button>
          <Button asChild type="button" variant="outline">
            <a href="/dashboard">Go to dashboard</a>
          </Button>
        </div>
      </div>
    </main>
  );
}
