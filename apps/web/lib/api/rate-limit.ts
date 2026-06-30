type RateLimitPolicy = {
  windowMs: number;
  maxRequests: number;
  bucket: string;
};

type RateLimitInput = {
  request: Request;
  policy: RateLimitPolicy;
  userId?: string | null;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }

  const realIp = request.headers.get('x-real-ip');
  return realIp?.trim() || 'unknown';
}

function buildKey(request: Request, policy: RateLimitPolicy, userId?: string | null): string {
  const actor = userId?.trim() || getClientIp(request);
  return `${policy.bucket}:${actor}`;
}

export function enforceRateLimit(input: RateLimitInput): Response | null {
  const now = Date.now();
  const key = buildKey(input.request, input.policy, input.userId);
  const current = store.get(key);

  if (!current || now >= current.resetAt) {
    store.set(key, {
      count: 1,
      resetAt: now + input.policy.windowMs,
    });
    return null;
  }

  if (current.count >= input.policy.maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return Response.json(
      {
        error: 'Rate limit exceeded',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSeconds),
        },
      },
    );
  }

  current.count += 1;
  store.set(key, current);
  return null;
}

export const rateLimitPolicies = {
  searchRead: {
    bucket: 'v1:search:get',
    windowMs: 60_000,
    maxRequests: 60,
  },
  chatSessionsRead: {
    bucket: 'v1:chat:sessions:get',
    windowMs: 60_000,
    maxRequests: 120,
  },
  chatSessionsWrite: {
    bucket: 'v1:chat:sessions:post',
    windowMs: 60_000,
    maxRequests: 30,
  },
  chatMessagesRead: {
    bucket: 'v1:chat:messages:get',
    windowMs: 60_000,
    maxRequests: 180,
  },
  chatMessagesWrite: {
    bucket: 'v1:chat:messages:post',
    windowMs: 60_000,
    maxRequests: 40,
  },
  notesWrite: {
    bucket: 'v1:notes:write',
    windowMs: 60_000,
    maxRequests: 40,
  },
  quizzesWrite: {
    bucket: 'v1:quizzes:write',
    windowMs: 60_000,
    maxRequests: 30,
  },
  quizAttemptsWrite: {
    bucket: 'v1:quiz-attempts:write',
    windowMs: 60_000,
    maxRequests: 30,
  },
  flashcardsWrite: {
    bucket: 'v1:flashcards:write',
    windowMs: 60_000,
    maxRequests: 40,
  },
  flashcardsGenerate: {
    bucket: 'v1:flashcards:generate',
    windowMs: 60_000,
    maxRequests: 12,
  },
  researchWrite: {
    bucket: 'v1:research:write',
    windowMs: 60_000,
    maxRequests: 30,
  },
  sourcesWrite: {
    bucket: 'v1:sources:write',
    windowMs: 60_000,
    maxRequests: 20,
  },
} as const satisfies Record<string, RateLimitPolicy>;
