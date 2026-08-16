import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth-shell';
import { ClerkSignUpForm } from '@/components/auth/clerk-sign-up-form';
import {
  isClerkEnabled,
  POST_AUTH_REDIRECT_PATH,
  sanitizePostAuthRedirect,
} from '@/lib/auth/post-auth-redirect';
import { Suspense } from 'react';

type SignUpPageProps = {
  searchParams: Promise<{ redirect_url?: string }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const redirectUrl = sanitizePostAuthRedirect(params.redirect_url ?? POST_AUTH_REDIRECT_PATH);

  if (isClerkEnabled()) {
    const { userId } = await auth();
    if (userId) {
      redirect(redirectUrl);
    }
  }

  return (
    <AuthShell mode="sign-up">
      <Suspense fallback={<div className="text-sm text-zinc-500">Loading sign-up…</div>}>
        <ClerkSignUpForm />
      </Suspense>
    </AuthShell>
  );
}
