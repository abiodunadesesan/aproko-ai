import { Redis } from '@upstash/redis';

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
let cachedUpstashClient: Redis | null = null;
let upstashDisabledForProcess = false;

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

function enforceInMemoryRateLimit(input: RateLimitInput): Response | null {
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

function getUpstashClient(): Redis | null {
  if (upstashDisabledForProcess) {
    return null;
  }

  if (cachedUpstashClient) {
    return cachedUpstashClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    return null;
  }

  try {
    cachedUpstashClient = new Redis({ url, token });
    return cachedUpstashClient;
  } catch {
    upstashDisabledForProcess = true;
    return null;
  }
}

export async function enforceRateLimit(input: RateLimitInput): Promise<Response | null> {
  if (process.env.E2E_MOCK_AUTH === 'true') {
    return null;
  }

  const redis = getUpstashClient();
  if (!redis) {
    return enforceInMemoryRateLimit(input);
  }

  const key = buildKey(input.request, input.policy, input.userId);

  try {
    const counter = await redis.incr(key);
    if (counter === 1) {
      await redis.pexpire(key, input.policy.windowMs);
    }

    const ttlMs = await redis.pttl(key);
    const resolvedTtlMs = ttlMs > 0 ? ttlMs : input.policy.windowMs;

    if (counter > input.policy.maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil(resolvedTtlMs / 1000));
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
    return null;
  } catch {
    upstashDisabledForProcess = true;
    return enforceInMemoryRateLimit(input);
  }
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
  writingPolishWrite: {
    bucket: 'v1:writing:polish:post',
    windowMs: 60_000,
    maxRequests: 30,
  },
  writingDetectWrite: {
    bucket: 'v1:writing:detect:post',
    windowMs: 60_000,
    maxRequests: 20,
  },
  writingDraftsWrite: {
    bucket: 'v1:writing:drafts:write',
    windowMs: 60_000,
    maxRequests: 40,
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
  billingCheckoutWrite: {
    bucket: 'v1:billing:checkout:post',
    windowMs: 60_000,
    maxRequests: 10,
  },
  billingSubscriptionRead: {
    bucket: 'v1:billing:subscription:get',
    windowMs: 60_000,
    maxRequests: 60,
  },
  meWrite: {
    bucket: 'v1:me:patch',
    windowMs: 60_000,
    maxRequests: 20,
  },
} as const satisfies Record<string, RateLimitPolicy>;
