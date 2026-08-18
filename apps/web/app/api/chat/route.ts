import { POST as extensionLiveContextPost } from '@/app/api/v1/extension/live-context/chat/route';
import { createFasterFlowChatAliasHandlers } from '@/lib/extension/fasterflow-chat-alias';

/**
 * FasterFlow-compatible chat door.
 * Same auth, quota, models, and SSE as `/api/v1/extension/live-context/chat`.
 * Accepts `{ fullPageContext, hoverContext, message, activeModel }` or Aproko live-context bodies.
 */
const handlers = createFasterFlowChatAliasHandlers({
  forward: (request) => extensionLiveContextPost(request),
});

export const OPTIONS = handlers.OPTIONS;
export const POST = handlers.POST;
