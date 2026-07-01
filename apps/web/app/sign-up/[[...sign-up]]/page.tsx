import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth-shell';
import { ClerkSignUpForm } from '@/components/auth/clerk-sign-up-form';
import { isClerkEnabled, POST_AUTH_REDIRECT_PATH } from '@/lib/auth/post-auth-redirect';

export default async function SignUpPage() {
  if (isClerkEnabled()) {
    const { userId } = await auth();
    if (userId) {
      redirect(POST_AUTH_REDIRECT_PATH);
    }
  }

  return (
    <AuthShell mode="sign-up">
      <ClerkSignUpForm />
    </AuthShell>
  );
}
