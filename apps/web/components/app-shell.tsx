'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  BookOpen,
  Brain,
  CreditCard,
  FolderOpen,
  LayoutDashboard,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
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
  icon: React.ComponentType<{ className?: string }>;
};

function toNavTestId(label: string): string {
  return `nav-link-${label.toLowerCase().replace(/\s+/g, '-')}`;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', isEnabled: true, icon: LayoutDashboard },
  { label: 'Search', href: '/search', isEnabled: true, icon: Search },
  { label: 'Library', href: '/library', isEnabled: true, icon: FolderOpen },
  { label: 'Chat', href: '/chat', isEnabled: true, icon: MessageSquare },
  { label: 'Memory', href: '/memory', isEnabled: true, icon: Brain },
  { label: 'Research', href: '/research', isEnabled: true, icon: Sparkles },
  { label: 'Study', href: '/study', isEnabled: true, icon: BookOpen },
  { label: 'Admin', href: '/admin', isEnabled: true, icon: ShieldCheck },
  { label: 'Settings', href: '/settings', isEnabled: true, icon: Settings },
  { label: 'Billing', href: '/billing', isEnabled: true, icon: CreditCard },
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

  const pathParts = pathname.split('/').filter(Boolean);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const href = `/${pathParts.slice(0, index + 1).join('/')}`;
          const isLast = index === crumbs.length - 1;

          return (
            <BreadcrumbItem key={`${crumb}-${href}`}>
              {isLast ? (
                <BreadcrumbPage>{crumb}</BreadcrumbPage>
              ) : (
                <>
                  <BreadcrumbLink asChild>
                    <Link href={href || '/dashboard'}>{crumb}</Link>
                  </BreadcrumbLink>
                  <BreadcrumbSeparator />
                </>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function AppShell({ title, subtitle, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const shouldRenderUserButton = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

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

  return (
    <SidebarProvider>
      <Sidebar data-testid="app-sidebar" variant="inset">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="font-semibold">Aproko AI</SidebarGroupLabel>
            <SidebarMenu>
              {navItems.map((item) => {
                if (!item.isEnabled || !item.href) {
                  return null;
                }

                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link data-testid={toNavTestId(item.label)} href={item.href}>
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4">
            <div className="flex min-w-0 items-center gap-2">
              <SidebarTrigger aria-label="Toggle sidebar" />
              <Separator className="h-4" orientation="vertical" />
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold">{title}</h1>
                <div className="hidden md:block">
                  <Breadcrumbs />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                aria-label="Open search"
                data-testid="open-search-shortcut"
                onClick={() => setIsCommandOpen(true)}
                size="sm"
                type="button"
                variant="outline"
              >
                <Search className="h-4 w-4" />
                Search
              </Button>
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    Account
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => navigateTo('/dashboard')}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigateTo('/settings')}>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigateTo('/billing')}>
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => navigateTo('/search')}>
                    Open Search
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div>
                {shouldRenderUserButton ? (
                  <UserButton afterSignOutUrl="/" />
                ) : (
                  <Badge variant="secondary">Guest</Badge>
                )}
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
      </SidebarInset>

      <CommandDialog open={isCommandOpen} onOpenChange={setIsCommandOpen}>
        <CommandInput placeholder="Jump to page..." />
        <CommandList>
          <CommandEmpty>No pages found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {navItems
              .filter((item): item is NavItem & { href: string } =>
                Boolean(item.href && item.isEnabled),
              )
              .map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem key={item.href} onSelect={() => navigateTo(item.href)}>
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {item.label === 'Search' ? <CommandShortcut>Cmd/Ctrl+K</CommandShortcut> : null}
                  </CommandItem>
                );
              })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </SidebarProvider>
  );
}
