import { processQueuedOcrJobs } from '@/lib/ingestion/process-ocr-job';
import { withPerformanceHeaders } from '@/lib/perf/http';

function isAuthorized(request: Request): boolean {
  const secret = process.env.INGEST_WORKER_SECRET?.trim();
  if (!secret) {
    return false;
  }

  const authHeader = request.headers.get('authorization')?.trim();
  if (authHeader === `Bearer ${secret}`) {
    return true;
  }

  return request.headers.get('x-ingest-worker-secret') === secret;
}

export function createProcessOcrRouteHandlers() {
  return {
    POST: async (request: Request) => {
      const startedAtMs = Date.now();

      if (!isAuthorized(request)) {
        return withPerformanceHeaders(
          Response.json({ error: 'Unauthorized' }, { status: 401 }),
          startedAtMs,
        );
      }

      const url = new URL(request.url);
      const limit = Math.min(Math.max(Number.parseInt(url.searchParams.get('limit') ?? '3', 10), 1), 10);
      const processed = await processQueuedOcrJobs(limit);

      return withPerformanceHeaders(
        Response.json({ data: { processed } }, { status: 200 }),
        startedAtMs,
      );
    },
  };
}

export const { POST } = createProcessOcrRouteHandlers();
