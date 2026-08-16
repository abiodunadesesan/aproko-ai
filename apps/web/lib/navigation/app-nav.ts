import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Brain,
  CreditCard,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Mic,
  PenLine,
  Puzzle,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export type AppNavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  enabled?: boolean;
};

export type AppNavGroup = {
  label?: string;
  items: AppNavItem[];
};

export const chatNavItem: AppNavItem = {
  id: 'chat',
  label: 'Chat',
  href: '/chat',
  icon: MessageSquare,
};

export const appNavGroups: AppNavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { id: 'search', label: 'Search', href: '/search', icon: Search },
      { id: 'transcripts', label: 'Transcripts', href: '/transcripts', icon: Mic },
      { id: 'library', label: 'Library', href: '/library', icon: FileText },
      { id: 'memory', label: 'Memory', href: '/memory', icon: Brain },
      { id: 'research', label: 'Research', href: '/research', icon: Sparkles },
      { id: 'study', label: 'Study', href: '/study', icon: BookOpen },
      { id: 'writing', label: 'Writing', href: '/writing', icon: PenLine },
      { id: 'live-context', label: 'Live context', href: '/extension/live', icon: Puzzle },
    ],
  },
  {
    label: 'Account',
    items: [
      { id: 'settings', label: 'Settings', href: '/settings', icon: Settings },
      { id: 'billing', label: 'Billing', href: '/billing', icon: CreditCard },
      { id: 'admin', label: 'Admin', href: '/admin', icon: ShieldCheck },
    ],
  },
];

export function getEnabledNavItems(options?: { isAdmin?: boolean }): AppNavItem[] {
  const isAdmin = options?.isAdmin ?? false;

  return [
    chatNavItem,
    ...appNavGroups.flatMap((group) =>
      group.items.filter((item) => {
        if (item.enabled === false) {
          return false;
        }
        if (item.id === 'admin' && !isAdmin) {
          return false;
        }
        return true;
      }),
    ),
  ];
}

export function navTestId(id: string): string {
  return `nav-link-${id}`;
}
