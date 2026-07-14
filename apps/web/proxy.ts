import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/search(.*)',
  '/library(.*)',
  '/chat(.*)',
  '/memory(.*)',
  '/research(.*)',
  '/study(.*)',
  '/transcripts(.*)',
  '/admin(.*)',
  '/settings(.*)',
  '/billing(.*)',
  '/api/v1/admin(.*)',
  '/api/v1/billing/subscription(.*)',
  '/api/v1/billing/checkout(.*)',
  '/api/v1/workspaces(.*)',
  '/api/v1/me(.*)',
]);

export default clerkMiddleware(
  async (auth, req) => {
    const pathname = req.nextUrl.pathname;

    if (pathname === '/sign-in' || pathname === '/sign-up') {
      const { userId } = await auth();
      if (userId) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
      return;
    }

    if (isProtectedRoute(req)) {
      const isE2EMockAuthEnabled = process.env.E2E_MOCK_AUTH === 'true';
      const hasE2EMockAuthCookie = req.cookies.get('aproko_e2e_auth')?.value === '1';

      if (isE2EMockAuthEnabled && hasE2EMockAuthCookie) {
        return;
      }

      await auth.protect({ unauthenticatedUrl: '/sign-in' });
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
