'use client';

import { ExtensionLiveClient } from '@/components/extension/extension-live-client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ExtensionLiveInner() {
  const searchParams = useSearchParams();
  const embed = searchParams.get('embed') === '1';
  return <ExtensionLiveClient embed={embed} />;
}

export default function ExtensionLivePage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-zinc-500">Loading…</div>}>
      <ExtensionLiveInner />
    </Suspense>
  );
}
