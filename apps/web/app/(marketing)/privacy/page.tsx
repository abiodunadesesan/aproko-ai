import type { Metadata } from 'next';
import { LegalPage } from '@/components/landing/legal-page';
import { privacyContent } from '@/lib/legal-content';

export const metadata: Metadata = {
  title: 'Privacy Policy | Aproko AI',
  description: 'How Aproko AI collects, uses, and protects your data.',
};

export default function PrivacyPage() {
  return <LegalPage breadcrumbKey="privacy" content={privacyContent} />;
}
