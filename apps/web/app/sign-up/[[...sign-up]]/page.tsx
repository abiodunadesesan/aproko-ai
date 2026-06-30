import { AuthShell } from '@/components/auth-shell';
import { clerkDarkAppearance } from '@/lib/clerk-appearance';
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <AuthShell mode="sign-up">
      <SignUp
        appearance={clerkDarkAppearance}
        fallbackRedirectUrl="/dashboard"
        forceRedirectUrl="/dashboard"
      />
    </AuthShell>
  );
}
