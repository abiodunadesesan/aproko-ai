# Source prompt — Screen & Live Context Understanding

> **Status:** Archived input. Adapted into V2 architecture at
> `docs/02-architecture/04-browser-extension-companion-v2.md` and backlog
> `docs/12-backlog/sprint-29-browser-extension-v2.md`.
>
> **Do not implement against this file as-is.** Paths (`src/app/...`) and
> unconstrained `TODO`-free scaffolding conflict with Aproko repo layout
> (`apps/web/app/...`) and `AGENTS.md` V1 web-only constraints.

---

# Role & Core Objective
You are an expert full-stack engineer and browser extension developer. Your task is to build a web-based "Screen & Live Context Understanding" feature. Because standard web apps cannot natively capture the user's screen or system keyboard shortcuts globally outside the browser window, this must be built as a dual-component system:
1. A **Chrome Browser Extension** (acting as the "agent" to capture global shortcuts, screen context, and active tab DOM).
2. A **Next.js Web Application** (acting as the main dashboard, AI processing hub, and workspace).

---

## Technical Stack & Architecture

### 1. Chrome Extension (Manifest V3)
- **Background Service Worker (`background.js`):** Coordinates messaging, listens for global command shortcuts via `chrome.commands`, and manages active tab state.
- **Content Script (`content.js`):** Injected automatically into web pages. Extracts full DOM text, visible innerText, page metadata (Title, URL), and handles an on-page Floating Assistant Overlay (UI injected via a Shadow DOM to avoid CSS conflicts).
- **Side Panel (`sidepanel.html` / `sidepanel.js`):** Uses the `chrome.sidePanel` API to provide a persistent, collapsible sidebar UI alongside the user's browsing experience.
- **Permissions:** `["activeTab", "scripting", "sidePanel", "commands", "storage", "tabs"]`

### 2. Next.js Web App (App Router + TailwindCSS)
- **Frontend Dashboard:** A clean, modern UI showcasing "Captured Sessions", "Live Streams", and an "AI Assistant Chat Window".
- **API Routes (`/api/chat`):** Implements Streaming responses using the Vercel AI SDK (`@ai-sdk/openai` or `@ai-sdk/anthropic`).
- **Context Payload Structure:** Accepts JSON containing `{ url, title, pageText, capturedAt, userQuery }` to inject directly into the system prompt.

---

## Step-by-Step Implementation Guide Required

Please generate the complete codebase organized into distinct, production-ready modules:

### Phase 1: The Chrome Extension
1. **`manifest.json`:** Configure Manifest V3 with `commands` matching `Ctrl+Shift+Y` (or `Cmd+Shift+Y` on Mac) to toggle the sidebar/overlay, and declare all necessary permissions.
2. **`background.js`:** Listen for `chrome.commands.onCommand`. When triggered, query the active tab, execute a script to extract text, and pass it directly to the Side Panel or Web App endpoint via a secure message.
3. **`content.js`:** Implement a function `getScreenContext()` that strips out script/style tags, extracts semantic visible text, and collects open graph metadata. Implement a message listener to return this data to the background worker.

### Phase 2: Next.js Context-Aware API Route
1. **`src/app/api/chat/route.ts`:** Write a POST handler using `StreamingTextResponse`.
2. **System Prompt Design:** Structure a strict system prompt that instructs the LLM:
   - "You are a live context assistant. You are analyzing the exact page/screen the user is looking at right now."
   - "Rely heavily on the provided context block below to answer the user's query."
   - Include variables for `[Current URL]`, `[Page Title]`, and `[Extracted Screen Text]`.

### Phase 3: Web App Real-Time Dashboard UI
1. **`src/app/page.tsx`:** Build a clean, responsive layout utilizing Tailwind CSS. Include:
   - A left column displaying real-time metadata of the synced browser tab.
   - A main chat window that renders streaming markdown responses.
   - Code snippet components featuring instant "Copy to Clipboard" actions.

---

## Development Constraints & Rules
- Write **complete, modular, and copy-pasteable files** with no placeholders, no `// TODO`, and no truncated sections.
- Ensure cross-origin communication between the Extension and the Next.js localhost web server uses proper security origins (`chrome-extension://*`).
- Provide precise setup instructions for loading the Extension in Developer Mode (`chrome://extensions`) and starting the Next.js server locally.
