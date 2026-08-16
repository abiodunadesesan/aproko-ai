import type { LucideIcon } from 'lucide-react';
import {
  CreditCard,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Mic,
  PenLine,
  Puzzle,
  Search,
  ShieldCheck,
  Sparkles,
  Brain,
  UserRound,
} from 'lucide-react';

export type AppPageId = keyof typeof appPageMeta;

export type AppPageMeta = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
};

export const appPageMeta = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Capture context quickly, keep momentum, and jump back in with AI.',
    icon: LayoutDashboard,
  },
  search: {
    title: 'Search',
    subtitle: 'Search across your workspace sources, notes, and memory items.',
    icon: Search,
  },
  transcripts: {
    title: 'My Transcripts',
    subtitle: 'Upload files or record your mic; audio becomes workspace transcripts.',
    icon: Mic,
  },
  library: {
    title: 'Library',
    subtitle: 'Upload and manage your documents.',
    icon: FileText,
  },
  librarySource: {
    title: 'Document',
    subtitle: 'Loading document preview and metadata...',
    icon: FileText,
  },
  chat: {
    title: 'AI Chat',
    subtitle: 'Ask questions grounded in your library with citations and memory context.',
    icon: MessageSquare,
  },
  memory: {
    title: 'Memory',
    subtitle: 'Items saved from chat and study — searchable across your workspace.',
    icon: Brain,
  },
  research: {
    title: 'Research',
    subtitle:
      'Create focused research workspaces that combine sources, chat context, and working notes.',
    icon: Sparkles,
  },
  study: {
    title: 'Study',
    subtitle: 'Quizzes, flashcards, and notes generated from your materials.',
    icon: GraduationCap,
  },
  writing: {
    title: 'Writing',
    subtitle: 'Polish drafts for clarity and tone — not detector evasion.',
    icon: PenLine,
  },
  liveContext: {
    title: 'Live browser context',
    subtitle: 'Ask Aproko about the page you are viewing via the Chrome extension.',
    icon: Puzzle,
  },
  extensionConnect: {
    title: 'Connect Chrome extension',
    subtitle: 'Sign-in cookies from this browser profile power the Aproko side panel.',
    icon: Puzzle,
  },
  settings: {
    title: 'Settings',
    subtitle: 'Your account details and subscription.',
    icon: UserRound,
  },
  billing: {
    title: 'Billing',
    subtitle: 'Review your plan, billing period, and subscription status.',
    icon: CreditCard,
  },
  admin: {
    title: 'Admin',
    subtitle: 'Platform-level operational view for users, workspace footprint, and usage.',
    icon: ShieldCheck,
  },
} satisfies Record<string, AppPageMeta>;
