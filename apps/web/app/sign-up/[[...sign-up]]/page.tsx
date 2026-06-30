import { AuthShell } from '@/components/auth-shell';
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <AuthShell
      mode="sign-up"
      subtitle="Create your account to start capturing, retrieving, and reusing everything you know."
      title="Create your workspace"
    >
      <SignUp
        appearance={{
          elements: {
            rootBox: 'w-full',
            card: 'w-full border border-border shadow-md',
          },
        }}
        fallbackRedirectUrl="/dashboard"
        forceRedirectUrl="/dashboard"
      />
    </AuthShell>
  );
}
