import type { AppTheme } from '@/lib/theme';

const sharedElements = {
  rootBox: 'w-full',
  footerActionLink:
    'text-zinc-900 font-semibold hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300',
};

export const clerkLightAppearance = {
  variables: {
    colorPrimary: '#18181b',
    colorText: '#18181b',
    colorTextSecondary: '#71717a',
    colorBackground: '#ffffff',
    colorInputBackground: '#ffffff',
    colorInputText: '#18181b',
    borderRadius: '0.75rem',
  },
  elements: {
    ...sharedElements,
    card: 'w-full border border-zinc-200 bg-white text-zinc-900 shadow-xl shadow-zinc-200/40',
    headerTitle: 'text-zinc-900',
    headerSubtitle: 'text-zinc-600',
    socialButtonsBlockButton: 'border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50',
    formButtonPrimary: 'bg-zinc-900 text-white hover:bg-zinc-800',
    formFieldInput: 'border-zinc-200 bg-white text-zinc-900',
    dividerLine: 'bg-zinc-200',
    dividerText: 'text-zinc-500',
  },
};

export const clerkDarkAppearance = {
  variables: {
    colorPrimary: '#fafafa',
    colorText: '#fafafa',
    colorTextSecondary: '#a1a1aa',
    colorBackground: '#09090b',
    colorInputBackground: '#18181b',
    colorInputText: '#fafafa',
    borderRadius: '0.75rem',
  },
  elements: {
    ...sharedElements,
    card: 'w-full border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-xl shadow-black/40',
    headerTitle: 'text-zinc-100',
    headerSubtitle: 'text-zinc-400',
    socialButtonsBlockButton: 'border border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800',
    formButtonPrimary: 'bg-zinc-100 text-zinc-950 hover:bg-white',
    formFieldInput: 'border-zinc-800 bg-zinc-900 text-zinc-100',
    dividerLine: 'bg-zinc-800',
    dividerText: 'text-zinc-500',
  },
};

export function getClerkAppearance(theme: AppTheme) {
  return theme === 'dark' ? clerkDarkAppearance : clerkLightAppearance;
}
