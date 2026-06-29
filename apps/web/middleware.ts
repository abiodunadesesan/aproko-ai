import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/library(.*)',
  '/chat(.*)',
  '/memory(.*)',
  '/study(.*)',
  '/settings(.*)',
  '/billing(.*)',
  '/api/v1/billing(.*)',
  '/api/v1/workspaces(.*)',
  '/api/v1/me(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const isE2EMockAuthEnabled = process.env.E2E_MOCK_AUTH === 'true';
    const hasE2EMockAuthCookie = req.cookies.get('aproko_e2e_auth')?.value === '1';

    if (isE2EMockAuthEnabled && hasE2EMockAuthCookie) {
      return;
    }

    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
