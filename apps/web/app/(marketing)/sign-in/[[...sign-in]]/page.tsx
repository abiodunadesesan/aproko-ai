import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth-shell';
import { ClerkSignInForm } from '@/components/auth/clerk-sign-in-form';
import {
  isClerkEnabled,
  POST_AUTH_REDIRECT_PATH,
  sanitizePostAuthRedirect,
} from '@/lib/auth/post-auth-redirect';
import { Suspense } from 'react';

type SignInPageProps = {
  searchParams: Promise<{ redirect_url?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const redirectUrl = sanitizePostAuthRedirect(params.redirect_url ?? POST_AUTH_REDIRECT_PATH);

  if (isClerkEnabled()) {
    const { userId } = await auth();
    if (userId) {
      redirect(redirectUrl);
    }
  }

  return (
    <AuthShell mode="sign-in">
      <Suspense fallback={<div className="text-sm text-zinc-500">Loading sign-in…</div>}>
        <ClerkSignInForm />
      </Suspense>
    </AuthShell>
  );
}
