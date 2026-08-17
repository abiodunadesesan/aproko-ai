'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ExtensionLiveClient } from '@/components/extension/extension-live-client';
import { isExtensionEmbedFrame } from '@/lib/extension/embed-frame';

function ExtensionLiveInner() {
  const searchParams = useSearchParams();
  const [inExtensionFrame, setInExtensionFrame] = useState(() =>
    typeof window !== 'undefined' ? isExtensionEmbedFrame() : false,
  );

  useLayoutEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.self !== window.top &&
      !window.location.search.includes('embed=1')
    ) {
      window.location.replace(`${window.location.pathname}?embed=1`);
    }
  }, []);

  useEffect(() => {
    setInExtensionFrame(isExtensionEmbedFrame());
  }, []);

  const embed = searchParams.get('embed') === '1' || inExtensionFrame;
  return <ExtensionLiveClient embed={embed} />;
}

export default function ExtensionLivePage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-zinc-500">Loading…</div>}>
      <ExtensionLiveInner />
    </Suspense>
  );
}
