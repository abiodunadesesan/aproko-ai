import type { Metadata } from 'next';
import { LegalPage } from '@/components/landing/legal-page';
import { termsContent } from '@/lib/legal-content';

export const metadata: Metadata = {
  title: 'Terms of Service | Aproko AI',
  description: 'Terms governing your use of Aproko AI.',
};

export default function TermsPage() {
  return <LegalPage breadcrumbKey="terms" content={termsContent} />;
}
