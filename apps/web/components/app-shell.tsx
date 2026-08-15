'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Search, SquarePen } from 'lucide-react';
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
import { cn } from '@/lib/utils';

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
  /** Full-bleed ChatGPT-style layout (no page header, no content max-width). */
  immersive?: boolean;
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
        className={cn(
          'h-9 rounded-xl text-[13px] transition-all duration-200',
          isActive
            ? 'bg-amber-500/12 font-medium text-amber-950 shadow-[inset_3px_0_0_0_theme(colors.amber.500)] dark:bg-amber-400/10 dark:text-amber-50 dark:shadow-[inset_3px_0_0_0_theme(colors.amber.400)]'
            : 'text-zinc-500 hover:bg-black/[0.04] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.05] dark:hover:text-zinc-100',
        )}
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
  immersive = false,
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

  function startNewChat() {
    if (typeof window !== 'undefined') {
      const prefix = 'aproko.chat.last-session.';
      const keysToRemove: string[] = [];
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (key?.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }
      for (const key of keysToRemove) {
        window.localStorage.removeItem(key);
      }
    }
    router.push('/chat?new=1');
  }

  const ChatIcon = chatNavItem.icon;

  return (
    <SidebarProvider>
      <Sidebar
        className="border-r border-black/[0.06] bg-[hsl(var(--sidebar-background))] dark:border-white/[0.06]"
        collapsible="icon"
        data-testid="app-sidebar"
        variant="inset"
      >
        <SidebarHeader className="gap-2 px-2 py-3">
          <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
            <AprokoLogo className="group-data-[collapsible=icon]:hidden" size="sm" />
            <SidebarTrigger
              aria-label="Toggle sidebar"
              className="h-8 w-8 shrink-0 rounded-xl text-zinc-500 hover:bg-black/[0.05] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-100"
            />
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="h-9 rounded-xl bg-zinc-900 text-[13px] font-medium text-white shadow-sm transition-transform hover:bg-zinc-800 active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
                onClick={startNewChat}
                tooltip="New chat"
              >
                <SquarePen className="h-4 w-4" />
                <span>New chat</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="gap-0 px-1">
          <SidebarGroup className="py-1">
            <SidebarMenu>
              <NavLink
                href={chatNavItem.href}
                icon={ChatIcon}
                id={chatNavItem.id}
                isActive={isActive(chatNavItem.href)}
                label={chatNavItem.label}
              />
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="h-9 rounded-xl text-[13px] text-zinc-500 hover:bg-black/[0.04] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.05] dark:hover:text-zinc-100"
                  onClick={() => setIsCommandOpen(true)}
                  tooltip="Search"
                >
                  <Search className="h-4 w-4" />
                  <span>Search</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          <SidebarSeparator className="mx-2 bg-zinc-200 dark:bg-zinc-800" />

          {appNavGroups.map((group) => (
            <SidebarGroup className="py-1" key={group.label ?? 'default'}>
              {group.label ? (
                <SidebarGroupLabel className="px-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-500">
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
                    // Search is pinned above.
                    if (item.id === 'search') {
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

        <SidebarFooter className="border-t border-black/[0.05] p-2 dark:border-white/[0.06]">
          <div className="group-data-[collapsible=icon]:hidden">
            <SidebarUser />
          </div>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset className={cn('aproko-mesh bg-background', immersive && 'min-h-svh !bg-background')}>
        <header
          className={cn(
            'sticky top-0 z-10 flex h-14 items-center justify-between gap-3 px-3 md:px-5',
            immersive
              ? 'border-b-0 bg-transparent'
              : 'border-b border-black/[0.05] bg-background/70 backdrop-blur-2xl dark:border-white/[0.06]',
          )}
        >
          <div className="flex min-w-0 items-center gap-2 md:hidden">
            <SidebarTrigger aria-label="Open sidebar" className="md:hidden" />
            <span className="truncate text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {title}
            </span>
          </div>

          <div className="hidden min-w-0 flex-1 md:block" />

          <div className="flex items-center gap-2">
            {!immersive ? (
              <Button
                aria-label="Open search"
                className="h-9 rounded-full border-black/[0.08] bg-white/80 text-zinc-700 shadow-sm backdrop-blur hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:bg-white/[0.07]"
                data-testid="open-search-shortcut"
                onClick={() => setIsCommandOpen(true)}
                size="sm"
                type="button"
                variant="outline"
              >
                <Search className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Search</span>
                <kbd className="pointer-events-none hidden rounded-md border border-black/[0.08] bg-black/[0.03] px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 lg:inline dark:border-white/10 dark:bg-white/[0.05] dark:text-zinc-400">
                  ⌘K
                </kbd>
              </Button>
            ) : null}
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

        <main
          className={cn('flex-1', immersive ? 'flex min-h-0 flex-col p-0' : 'p-4 md:p-7 lg:p-9')}
        >
          <div
            className={cn(
              immersive ? 'flex min-h-0 flex-1 flex-col' : 'mx-auto max-w-6xl space-y-7',
            )}
          >
            {!immersive ? (
              headerIcon ? (
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
              )
            ) : null}
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
