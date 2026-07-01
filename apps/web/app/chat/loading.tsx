import { AppLoadingShell } from '@/components/app/app-loading-shell';
import { ChatSkeleton } from '@/components/app/chat-skeleton';
import { appPageMeta } from '@/lib/navigation/app-pages';

export default function ChatLoading() {
  return (
    <AppLoadingShell meta={appPageMeta.chat}>
      <ChatSkeleton />
    </AppLoadingShell>
  );
}
