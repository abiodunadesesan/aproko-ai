import { captureServerError } from '@/lib/observability/server';

type CaptureServerErrorDependency = typeof captureServerError;

type ObservabilityErrorsRouteDependencies = {
  captureServerError: CaptureServerErrorDependency;
};

export function createObservabilityErrorsRouteHandlers(deps: ObservabilityErrorsRouteDependencies) {
  return {
    POST: async (request: Request) => {
      try {
        const body = (await request.json().catch(() => null)) as {
          message?: string;
          stack?: string | null;
          source?: string | null;
          route?: string | null;
        } | null;

        const message = body?.message?.trim() ?? '';
        if (!message) {
          return Response.json({ error: 'message is required' }, { status: 400 });
        }

        const error = new Error(message);
        if (body?.stack) {
          error.stack = body.stack;
        }

        deps.captureServerError(error, {
          source: body?.source ?? 'client',
          route: body?.route ?? null,
        });

        return Response.json({ ok: true }, { status: 202 });
      } catch (error) {
        console.error('Failed to capture client error', error);
        return Response.json({ error: 'Failed to capture error' }, { status: 500 });
      }
    },
  };
}

export const { POST } = createObservabilityErrorsRouteHandlers({
  captureServerError,
});
