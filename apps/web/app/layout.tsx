import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { ObservabilityProvider } from '@/components/observability-provider';
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
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <ObservabilityProvider />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
