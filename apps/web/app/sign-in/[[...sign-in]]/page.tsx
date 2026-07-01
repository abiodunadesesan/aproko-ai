import { AuthShell } from '@/components/auth-shell';
import { ClerkSignInForm } from '@/components/auth/clerk-sign-in-form';

export default function SignInPage() {
  return (
    <AuthShell mode="sign-in">
      <ClerkSignInForm />
    </AuthShell>
  );
}
