# Sprint 25 — Chat PromptInput (AI Elements)

## Status

- **State:** Shipped
- **Depends on:** Sprint 21 AI Elements message thread

## Goal

Replace the custom chat composer with AI Elements `PromptInput` while keeping the workspace SSE backend.

## Scope

- Install / add `prompt-input` from AI Elements registry
- Extract composer from `chat/page.tsx` into `ChatPromptInput`
- Preserve test ids: `chat-input`, `chat-send`, voice button behavior

## Done

- `npx shadcn add` prompt-input (+ input-group, spinner, hover-card deps)
- `ChatPromptInput` uses `PromptInput` / `PromptInputTextarea` / `PromptInputSubmit` / voice `PromptInputButton`
- Parent still owns SSE `sendMessage` (no `useChat`)

## Out of scope

- `@ai-sdk/react` `useChat` migration
- Attachments, tool panels
