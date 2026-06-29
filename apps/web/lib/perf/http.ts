type PerformanceHeaderOptions = {
  cacheControl?: string;
};

export function withPerformanceHeaders(
  response: Response,
  startedAtMs: number,
  options?: PerformanceHeaderOptions,
): Response {
  const durationMs = Math.max(0, Date.now() - startedAtMs);
  response.headers.set('server-timing', `app;dur=${durationMs}`);
  response.headers.set('x-response-time', `${durationMs}ms`);

  if (options?.cacheControl && !response.headers.has('cache-control')) {
    response.headers.set('cache-control', options.cacheControl);
  }

  return response;
}
