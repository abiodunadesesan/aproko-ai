'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Search } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { AprokoLogo } from '@/components/brand/aproko-logo';
import { PageHeader } from '@/components/app/page-header';
import { SidebarUpgradeCard } from '@/components/app/sidebar-upgrade-card';
import { SidebarUser } from '@/components/app/sidebar-user';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { appNavGroups, chatNavItem, getEnabledNavItems, navTestId } from '@/lib/navigation/app-nav';
import { shouldOpenSearchFromShortcut } from '@/lib/navigation/shortcuts';

type AppShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Optional icon for the in-content page header (FasterFlow-style). */
  headerIcon?: LucideIcon;
  headerBadge?: string;
  headerAction?: ReactNode;
  /** Hide the duplicate subtitle block when using PageHeader in content. */
  hideSubtitle?: boolean;
};

function NavLink({
  href,
  id,
  label,
  icon: Icon,
  isActive,
}: {
  href: string;
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        className={
          isActive
            ? 'bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
            : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
        }
        isActive={isActive}
      >
        <Link data-testid={navTestId(id)} href={href}>
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppShell({
  title,
  subtitle,
  children,
  headerIcon,
  headerBadge,
  headerAction,
  hideSubtitle = false,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const shouldRenderUserButton = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const navItems = useMemo(() => getEnabledNavItems({ isAdmin }), [isAdmin]);

  useEffect(() => {
    async function loadAccess() {
      try {
        const response = await fetch('/api/v1/me', { cache: 'no-store' });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as { isAdmin?: boolean };
        setIsAdmin(Boolean(payload.isAdmin));
      } catch {
        // Non-blocking: sidebar falls back to hiding admin nav.
      }
    }

    void loadAccess();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!shouldOpenSearchFromShortcut(event)) {
        return;
      }

      event.preventDefault();
      setIsCommandOpen((open) => !open);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  function navigateTo(href: string) {
    setIsCommandOpen(false);
    router.push(href);
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const ChatIcon = chatNavItem.icon;

  return (
    <SidebarProvider>
      <Sidebar
        className="border-r border-zinc-200/80 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/80"
        collapsible="icon"
        data-testid="app-sidebar"
        variant="inset"
      >
        <SidebarHeader className="border-b border-zinc-200/80 px-2 py-3 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
            <AprokoLogo className="group-data-[collapsible=icon]:hidden" size="sm" />
            <SidebarTrigger
              aria-label="Toggle sidebar"
              className="h-8 w-8 shrink-0 rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            />
          </div>
        </SidebarHeader>

        <SidebarContent className="gap-0">
          <SidebarGroup className="py-2">
            <SidebarMenu>
              <NavLink
                href={chatNavItem.href}
                icon={ChatIcon}
                id={chatNavItem.id}
                isActive={isActive(chatNavItem.href)}
                label={chatNavItem.label}
              />
            </SidebarMenu>
          </SidebarGroup>

          <SidebarSeparator />

          {appNavGroups.map((group) => (
            <SidebarGroup className="py-2" key={group.label ?? 'default'}>
              {group.label ? (
                <SidebarGroupLabel className="px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-500">
                  {group.label}
                </SidebarGroupLabel>
              ) : null}
              <SidebarMenu>
                {group.items
                  .filter((item) => {
                    if (item.enabled === false) {
                      return false;
                    }
                    if (item.id === 'admin' && !isAdmin) {
                      return false;
                    }
                    return true;
                  })
                  .map((item) => (
                    <NavLink
                      href={item.href}
                      icon={item.icon}
                      id={item.id}
                      isActive={isActive(item.href)}
                      key={item.id}
                      label={item.label}
                    />
                  ))}
              </SidebarMenu>
            </SidebarGroup>
          ))}

          <div className="mt-auto px-0 pb-2 group-data-[collapsible=icon]:hidden">
            <SidebarUpgradeCard />
          </div>
        </SidebarContent>

        <SidebarFooter className="border-t border-zinc-200/80 p-2 dark:border-zinc-800">
          <div className="group-data-[collapsible=icon]:hidden">
            <SidebarUser />
          </div>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset className="bg-zinc-50/50 dark:bg-zinc-950/50">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b border-zinc-200/80 bg-white/90 px-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90 md:px-6">
          <div className="flex min-w-0 items-center gap-2 md:hidden">
            <SidebarTrigger aria-label="Open sidebar" className="md:hidden" />
            <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {title}
            </span>
          </div>

          <div className="hidden min-w-0 flex-1 md:block" />

          <div className="flex items-center gap-2">
            <Button
              aria-label="Open search"
              className="h-9 rounded-full border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              data-testid="open-search-shortcut"
              onClick={() => setIsCommandOpen(true)}
              size="sm"
              type="button"
              variant="outline"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="pointer-events-none hidden rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 lg:inline dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                ⌘K
              </kbd>
            </Button>
            <ThemeToggle />
            {shouldRenderUserButton ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <Badge className="hidden sm:inline-flex" variant="secondary">
                Guest
              </Badge>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl space-y-6">
            {headerIcon ? (
              <PageHeader
                icon={headerIcon}
                subtitle={subtitle}
                title={title}
                {...(headerBadge ? { badge: headerBadge } : {})}
                {...(headerAction ? { action: headerAction } : {})}
              />
            ) : (
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {title}
                </h1>
                {!hideSubtitle ? (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>
                ) : null}
              </div>
            )}
            {children}
          </div>
        </main>
      </SidebarInset>

      <CommandDialog open={isCommandOpen} onOpenChange={setIsCommandOpen}>
        <CommandInput placeholder="Jump to page..." />
        <CommandList>
          <CommandEmpty>No pages found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem key={item.href} onSelect={() => navigateTo(item.href)}>
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.id === 'search' ? <CommandShortcut>Cmd/Ctrl+K</CommandShortcut> : null}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </SidebarProvider>
  );
}
