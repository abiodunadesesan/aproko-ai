import { AuthShell } from '@/components/auth-shell';
import { ClerkSignUpForm } from '@/components/auth/clerk-sign-up-form';

export default function SignUpPage() {
  return (
    <AuthShell mode="sign-up">
      <ClerkSignUpForm />
    </AuthShell>
  );
}
