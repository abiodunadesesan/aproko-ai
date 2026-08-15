# Sprint 25 — Chat PromptInput (AI Elements)

## Status

- **State:** Planned
- **Depends on:** Sprint 21 AI Elements message thread

## Goal

Replace the custom chat composer with AI Elements `PromptInput` while keeping the workspace SSE backend.

## Scope

- Install / add `prompt-input` from AI Elements registry
- Extract composer from `chat/page.tsx` into `ChatPromptInput`
- Preserve test ids: `chat-input`, `chat-send`, voice button behavior

## Out of scope

- `@ai-sdk/react` `useChat` migration
- Attachments, tool panels
