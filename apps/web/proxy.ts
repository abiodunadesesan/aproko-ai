import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { sanitizePostAuthRedirect } from '@/lib/auth/post-auth-redirect';

const isProtectedPage = createRouteMatcher([
  '/dashboard(.*)',
  '/search(.*)',
  '/library(.*)',
  '/chat(.*)',
  '/memory(.*)',
  '/research(.*)',
  '/study(.*)',
  '/writing(.*)',
  '/transcripts(.*)',
  '/admin(.*)',
  '/settings(.*)',
  '/billing(.*)',
  '/extension(.*)',
]);

const isProtectedApi = createRouteMatcher([
  '/api/v1/admin(.*)',
  '/api/v1/billing/subscription(.*)',
  '/api/v1/billing/checkout(.*)',
  '/api/v1/workspaces(.*)',
  '/api/v1/live-context(.*)',
  '/api/v1/me(.*)',
]);

export default clerkMiddleware(
  async (auth, req) => {
    const pathname = req.nextUrl.pathname;

    if (pathname === '/sign-in' || pathname === '/sign-up') {
      const { userId } = await auth();
      if (userId) {
        const redirectUrl = sanitizePostAuthRedirect(
          req.nextUrl.searchParams.get('redirect_url'),
        );
        // Never bounce authenticated users onto an API path from sign-in.
        if (redirectUrl.startsWith('/api/')) {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
        return NextResponse.redirect(new URL(redirectUrl, req.url));
      }
      return;
    }

    const isE2EMockAuthEnabled = process.env.E2E_MOCK_AUTH === 'true';
    const hasE2EMockAuthCookie = req.cookies.get('aproko_e2e_auth')?.value === '1';
    if (isE2EMockAuthEnabled && hasE2EMockAuthCookie) {
      return;
    }

    // APIs must return JSON 401 — HTML sign-in redirects break fetch/SSE clients
    // (extension iframe showed an empty assistant with no error).
    if (isProtectedApi(req)) {
      const { userId } = await auth();
      if (!userId) {
        const authHeader = req.headers.get('Authorization')?.trim();
        if (authHeader?.startsWith('Bearer ext.')) {
          // Route handlers validate extension handoff tokens.
          return;
        }
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return;
    }

    if (isProtectedPage(req)) {
      // Extension side panel / Safari popup embeds this route in an iframe.
      // Do not redirect to Clerk sign-in inside the iframe — Google OAuth breaks there.
      const secFetchDest = req.headers.get('sec-fetch-dest');
      if (
        pathname === '/extension/live' &&
        (req.nextUrl.searchParams.get('embed') === '1' || secFetchDest === 'iframe')
      ) {
        return;
      }

      const returnTo = `${pathname}${req.nextUrl.search}`;
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', returnTo);
      await auth.protect({ unauthenticatedUrl: signInUrl.href });
    }
  },
  {
    signInUrl: '/sign-in',
    signUpUrl: '/sign-up',
  },
);

export const config = {
  matcher: [
    '/((?!_next|[^?]*.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
