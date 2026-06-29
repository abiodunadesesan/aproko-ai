'use client';

import { useEffect } from 'react';

export default function GlobalError({
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
        source: 'global-error-boundary',
        route: typeof window !== 'undefined' ? window.location.pathname : null,
      }),
      keepalive: true,
    });
  }, [error]);

  return (
    <html>
      <body className="bg-background p-6 text-foreground">
        <h2 className="text-lg font-semibold">Something went wrong.</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The issue has been reported. Please try reloading this page.
        </p>
        <button className="mt-4 rounded-md border px-3 py-2 text-sm" onClick={reset} type="button">
          Try again
        </button>
      </body>
    </html>
  );
}
