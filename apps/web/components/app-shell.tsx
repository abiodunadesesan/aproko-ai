'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { UserButton } from '@clerk/nextjs';
import { cardClass } from '@aproko/ui';
import { ThemeToggle } from '@/components/theme-toggle';
import { shouldOpenSearchFromShortcut } from '@/lib/navigation/shortcuts';

type AppShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

type NavItem = {
  label: string;
  href?: string;
  isEnabled: boolean;
};

function toNavTestId(label: string): string {
  return `nav-link-${label.toLowerCase().replace(/\s+/g, '-')}`;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', isEnabled: true },
  { label: 'Search', href: '/search', isEnabled: true },
  { label: 'Library', href: '/library', isEnabled: true },
  { label: 'Chat', href: '/chat', isEnabled: true },
  { label: 'Memory', href: '/memory', isEnabled: true },
  { label: 'Research', href: '/research', isEnabled: true },
  { label: 'Study', href: '/study', isEnabled: true },
  { label: 'Admin', href: '/admin', isEnabled: true },
  { label: 'Settings', href: '/settings', isEnabled: true },
  { label: 'Billing', href: '/billing', isEnabled: true },
];

function Breadcrumbs() {
  const pathname = usePathname();

  const crumbs = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    if (!parts.length) {
      return ['Dashboard'];
    }

    return parts.map((part) =>
      part.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    );
  }, [pathname]);

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      {crumbs.join(' / ')}
    </nav>
  );
}

export function AppShell({ title, subtitle, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!shouldOpenSearchFromShortcut(event)) {
        return;
      }

      event.preventDefault();
      router.push('/search');
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside
          aria-label="Primary"
          data-testid="app-sidebar"
          className={`fixed inset-y-0 left-0 z-30 w-72 border-r bg-background p-4 transition-transform md:static md:translate-x-0 ${
            mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm font-semibold">Aproko AI</p>
            <button
              aria-label="Close menu"
              className="rounded-md border px-2 py-1 text-xs md:hidden"
              onClick={() => setMobileNavOpen(false)}
              type="button"
            >
              Close
            </button>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              if (!item.isEnabled || !item.href) {
                return (
                  <button
                    className="w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground"
                    disabled
                    key={item.label}
                    type="button"
                  >
                    {item.label} (Soon)
                  </button>
                );
              }

              const active = pathname.startsWith(item.href);
              return (
                <Link
                  aria-current={active ? 'page' : undefined}
                  className={`block rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    active ? 'bg-foreground text-background' : 'hover:bg-muted'
                  }`}
                  data-testid={toNavTestId(item.label)}
                  href={item.href}
                  key={item.label}
                  onClick={() => setMobileNavOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {mobileNavOpen ? (
          <button
            aria-label="Close navigation overlay"
            className="fixed inset-0 z-20 bg-black/30 md:hidden"
            onClick={() => setMobileNavOpen(false)}
            type="button"
          />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-2">
                <button
                  aria-label="Open sidebar"
                  className="rounded-md border px-3 py-2 text-sm md:hidden"
                  onClick={() => setMobileNavOpen(true)}
                  type="button"
                >
                  Menu
                </button>
                <div>
                  <h1 className="text-lg font-semibold">{title}</h1>
                  <Breadcrumbs />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  aria-label="Open search"
                  className="rounded-md border px-3 py-2 text-sm"
                  data-testid="open-search-shortcut"
                  onClick={() => router.push('/search')}
                  type="button"
                >
                  Search (Cmd/Ctrl+K)
                </button>
                <ThemeToggle />
                <div className={cardClass}>
                  <UserButton afterSignOutUrl="/" />
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
