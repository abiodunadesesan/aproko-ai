# Sprint 21 — Chat UX (AI Elements)

## Status

- **State:** Shipped (web)
- **Depends on:** custom SSE chat backend (unchanged)

## Goal

Upgrade Chat message rendering with Vercel AI Elements while keeping the existing workspace-scoped SSE API.

## Scope

- Install `message`, `conversation`, and `sources` from AI Elements registry
- `ChatMessageThread` component using `MessageResponse` (Streamdown markdown), auto-scroll `Conversation`, collapsible `Sources` for citations
- Preserve E2E test ids: `chat-welcome`, `chat-user-message`, `chat-assistant-message`, `chat-citation`

## Out of scope

- Migrating to `@ai-sdk/react` `useChat` (backend SSE format unchanged)
- Tool-call / reasoning panels
- PromptInput replacement for composer

## Artifacts

- `apps/web/components/ai-elements/message.tsx`
- `apps/web/components/ai-elements/conversation.tsx`
- `apps/web/components/ai-elements/sources.tsx`
- `apps/web/components/app/chat-message-thread.tsx`
- `apps/web/app/(app)/chat/page.tsx`
