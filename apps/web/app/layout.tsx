import type { Metadata } from 'next';
import { LocaleRootLayoutShell } from '@/components/locale-root-layout';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aproko AI',
  description: 'Production-grade AI knowledge operating system',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <LocaleRootLayoutShell>{children}</LocaleRootLayoutShell>;
}
