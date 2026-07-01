import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth-shell';
import { ClerkSignInForm } from '@/components/auth/clerk-sign-in-form';
import { isClerkEnabled, POST_AUTH_REDIRECT_PATH } from '@/lib/auth/post-auth-redirect';

export default async function SignInPage() {
  if (isClerkEnabled()) {
    const { userId } = await auth();
    if (userId) {
      redirect(POST_AUTH_REDIRECT_PATH);
    }
  }

  return (
    <AuthShell mode="sign-in">
      <ClerkSignInForm />
    </AuthShell>
  );
}
