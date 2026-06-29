# 02 - Low-Fidelity Wireframes

These are structural ASCII wireframes for every V1 web screen.

---

## 1) Landing Page

```text
+--------------------------------------------------------------------------------+
| Aproko AI                                                                      |
|------------------------------------------------------------------------------- |
| [Logo]                                     [Sign In] [Get Started]            |
|                                                                                |
|  Headline: Your AI Knowledge Operating System                                 |
|  Subtext: Upload, search, and chat with everything you know.                  |
|  [Get Started]   [View Demo]                                                   |
|                                                                                |
|  +-------------------+ +-------------------+ +-------------------+             |
|  | Chat with files   | | Memory timeline   | | Research compare  |             |
|  +-------------------+ +-------------------+ +-------------------+             |
|                                                                                |
|  Footer: Privacy | Terms | Contact                                             |
+--------------------------------------------------------------------------------+
```

## 2) Sign In / Sign Up

```text
+------------------------------------------------------+
| Aproko AI                                            |
|------------------------------------------------------|
|                   [Auth Card]                        |
|  Sign In / Sign Up                                   |
|  Email:    [____________________]                    |
|  Password: [____________________]                    |
|  [ Sign In ]                                         |
|  [ Continue with Google ]                            |
|  Forgot password? [Reset]                            |
|                                                      |
|  Need an account? [Create one]                       |
+------------------------------------------------------+
```

## 3) Dashboard

```text
+--------------------------------------------------------------------------------+
| Sidebar |                               Home / Dashboard                       |
|---------|----------------------------------------------------------------------|
| Home    | +------------------+ +------------------+ +-----------------------+  |
| Chat    | | Recent Activity  | | Recent Uploads   | | Memory Timeline       |  |
| Library | +------------------+ +------------------+ +-----------------------+  |
| Memory  |                                                                      |
| Research| +------------------+ +------------------+ +-----------------------+  |
| Study   | | Continue Chat    | | Quick Actions    | | Suggested Next Steps  |  |
| Settings| +------------------+ +------------------+ +-----------------------+  |
+--------------------------------------------------------------------------------+
```

## 4) AI Chat

```text
+--------------------------------------------------------------------------------+
| Sidebar | Threads                    | Chat Pane                    | Citations|
|---------|----------------------------|------------------------------|----------|
| Home    | [Session A]                | User: Ask about onboarding   | [1] Doc  |
| Chat    | [Session B]                | AI: ...streaming response... | [2] Slide|
| Library | [Session C]                |                              | [3] Note |
| Memory  |                            | [ message list ]             |          |
| Research|                            |------------------------------|----------|
| Study   |                            | [input....................] [Send]     |
| Settings|                            | Scope: (Docs | Project | Workspace)     |
+--------------------------------------------------------------------------------+
```

## 5) Library

```text
+--------------------------------------------------------------------------------+
| Sidebar |                               Library                                |
|---------|----------------------------------------------------------------------|
| Home    | [Upload Files] [New Folder] [New Project]                            |
| Chat    |----------------------------------------------------------------------|
| Library | Filters: Type | Status | Project | Date                               |
| Memory  | +------------------------------------------------------------------+ |
| Research| | Name        | Type   | Project | Status      | Updated            | |
| Study   | | Q2 report   | PDF    | GTM     | Processing  | 2m ago             | |
| Settings| | Notes.md    | MD     | Growth  | Ready       | 1h ago             | |
|         | +------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------+
```

## 6) Document Viewer

```text
+--------------------------------------------------------------------------------+
| Sidebar | Document Header: Q2 Report.pdf | Status: Ready | Actions: Ask AI     |
|---------|----------------------------------------------------------------------|
| Home    | Document Canvas (page/slide/text view)                               |
| Chat    | +----------------------------------------------------------------------+
| Library | |  [Rendered page / text / image with OCR overlay]                   | |
| Memory  | +----------------------------------------------------------------------+
| Research| Right Panel:                                                           |
| Study   | - Citations linked to this document                                   |
| Settings| - Source metadata                                                      |
|         | - Add note / summarize selection                                      |
+--------------------------------------------------------------------------------+
```

## 7) Memory Timeline

```text
+--------------------------------------------------------------------------------+
| Sidebar |                            Memory Timeline                           |
|---------|----------------------------------------------------------------------|
| Home    | Filters: Type | Source | Date | Confidence                            |
| Chat    |----------------------------------------------------------------------|
| Library | [Today]  - Extracted key fact from Document A                        |
| Memory  | [Yesterday] - Decision summary from Chat Session B                   |
| Research| [Jun 20] - Meeting summary event                                     |
| Study   |                                                                      |
| Settings| Event Detail Panel: source links | related chat | pin/unpin          |
+--------------------------------------------------------------------------------+
```

## 8) Research

```text
+--------------------------------------------------------------------------------+
| Sidebar |                             Research                                 |
|---------|----------------------------------------------------------------------|
| Home    | Source Selector: [Doc A] [Doc B] [Doc C] [ + Add ]                  |
| Chat    |----------------------------------------------------------------------|
| Library | Prompt / Objective: [Compare market risks across sources......]      |
| Memory  | [Generate Structured Summary]                                        |
| Research|----------------------------------------------------------------------|
| Study   | Output Sections:                                                      |
| Settings| - Similarities                                                        |
|         | - Differences                                                         |
|         | - Contradictions                                                      |
|         | - Recommendations                                                     |
+--------------------------------------------------------------------------------+
```

## 9) Notes

```text
+--------------------------------------------------------------------------------+
| Sidebar | Notes List                 | Editor                                  |
|---------|----------------------------|------------------------------------------|
| Home    | [Weekly recap]             | Title: [____________________________]    |
| Chat    | [Project ideas]            |------------------------------------------|
| Library | [Meeting actions]          | Rich Text Body                          |
| Memory  |                            | [......................................] |
| Research| Tags: #strategy #research  |                                          |
| Study   |                            | AI Tools: [Rewrite] [Summarize] [Expand]|
| Settings|                            | [Translate]                              |
+--------------------------------------------------------------------------------+
```

## 10) Flashcards

```text
+--------------------------------------------------------------------------------+
| Sidebar | Decks                      | Review / Generate                        |
|---------|----------------------------|------------------------------------------|
| Home    | [Biology Deck]             | Deck: Biology Deck                       |
| Chat    | [Market Terms]             | Card 12/40                               |
| Library | [Create Deck]              | Q: What is ...?                          |
| Memory  |                            | A: [Reveal]                              |
| Research|                            | [Again] [Hard] [Good] [Easy]             |
| Study   |                            |------------------------------------------|
| Settings|                            | [Generate cards from Notes/Docs]         |
+--------------------------------------------------------------------------------+
```

## 11) Quiz

```text
+--------------------------------------------------------------------------------+
| Sidebar | Quiz List                  | Quiz Attempt                             |
|---------|----------------------------|------------------------------------------|
| Home    | [Q1 Product Quiz]          | Question 3 of 10                         |
| Chat    | [Research Methods Quiz]    | Which statement is correct?              |
| Library | [Generate New Quiz]        | ( ) A  ( ) B  ( ) C  ( ) D               |
| Memory  |                            | [Next]                                   |
| Research|                            |------------------------------------------|
| Study   |                            | Progress: [###-------]                   |
| Settings|                            | Submit | Review Results                  |
+--------------------------------------------------------------------------------+
```

## 12) Settings

```text
+--------------------------------------------------------------------------------+
| Sidebar | Settings Tabs                                                      |
|---------|--------------------------------------------------------------------|
| Home    | [Profile] [AI Preferences] [Privacy] [Workspace] [Billing]        |
| Chat    |--------------------------------------------------------------------|
| Library | Profile: name, avatar, email                                      |
| Memory  | AI Preferences: response style, default scope                      |
| Research| Privacy: data controls and retention toggles                       |
| Study   | Workspace: name, slug, membership                                  |
| Settings|                                                                    |
+--------------------------------------------------------------------------------+
```

## 13) Billing

```text
+--------------------------------------------------------------------------------+
| Sidebar |                               Billing                                |
|---------|----------------------------------------------------------------------|
| Home    | Current Plan: Pro                                                    |
| Chat    | Usage: Tokens [#####-----] Storage [###-------]                      |
| Library |----------------------------------------------------------------------|
| Memory  | [Upgrade Plan] [Manage Subscription]                                 |
| Research|----------------------------------------------------------------------|
| Study   | Invoice History:                                                      |
| Settings| - INV-1001  Paid  Jun 2026                                           |
|         | - INV-0988  Paid  May 2026                                           |
+--------------------------------------------------------------------------------+
```

---

## UX Sequence Alignment

This wireframe set follows the agreed execution order:
1. Product Blueprint
2. UX Specification
3. Wireframes
4. Database Schema
5. API Specification
6. AI Memory Architecture
7. RAG Pipeline
8. Design System
9. Project Scaffolding
10. Authentication
11. Dashboard
12. AI Chat
13. Library
14. Memory
15. Search
16. Notes
17. Flashcards
18. Launch MVP

## TODO - Wireframe Follow-ups

- `TODO`: Convert ASCII wireframes into clickable low-fidelity prototype.
- `TODO`: Add state-by-state wireframes for all error and loading variants.
- `TODO`: Validate keyboard-only navigation flow against all primary journeys.
