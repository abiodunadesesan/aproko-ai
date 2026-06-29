import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aproko AI',
  description: 'Production-grade AI SaaS monorepo scaffold'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
