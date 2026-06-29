import Link from 'next/link';
import { buttonPrimaryClass, buttonSecondaryClass } from '@aproko/ui';

export default function LandingPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-16">
      <header className="flex items-center justify-between">
        <div className="text-lg font-semibold">Aproko AI</div>
        <div className="flex items-center gap-3">
          <Link className="text-sm text-muted-foreground hover:text-foreground" href="/sign-in">
            Sign in
          </Link>
          <Link className={buttonPrimaryClass} href="/sign-up">
            Get started
          </Link>
        </div>
      </header>

      <section className="mt-20 space-y-6">
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight">
          Your AI Knowledge Operating System.
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Capture, organize, and understand everything you know in one workspace.
        </p>
        <div className="flex items-center gap-3">
          <Link className={buttonPrimaryClass} href="/sign-up">
            Create account
          </Link>
          <Link className={buttonSecondaryClass} href="/dashboard">
            Open dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
