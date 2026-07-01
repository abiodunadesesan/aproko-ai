import { AppLoadingShell } from '@/components/app/app-loading-shell';
import { ChatSkeleton } from '@/components/app/chat-skeleton';

export default function ChatLoading() {
  return (
    <AppLoadingShell pageId="chat">
      <ChatSkeleton />
    </AppLoadingShell>
  );
}
