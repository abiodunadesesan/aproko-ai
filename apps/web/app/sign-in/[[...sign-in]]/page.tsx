import { AuthShell } from '@/components/auth-shell';
import { clerkDarkAppearance } from '@/lib/clerk-appearance';
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <AuthShell
      mode="sign-in"
      subtitle="Sign in to continue building your memory graph, chats, and study outputs."
      title="Welcome back"
    >
      <SignIn
        appearance={clerkDarkAppearance}
        fallbackRedirectUrl="/dashboard"
        forceRedirectUrl="/dashboard"
      />
    </AuthShell>
  );
}
