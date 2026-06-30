import { AuthShell } from '@/components/auth-shell';
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <AuthShell
      mode="sign-in"
      subtitle="Sign in to continue building your memory graph, chats, and study outputs."
      title="Welcome back"
    >
      <SignIn
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
