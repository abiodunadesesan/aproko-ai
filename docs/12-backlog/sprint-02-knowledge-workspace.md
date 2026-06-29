# Sprint 02 - Knowledge Workspace

## Sprint Goal

Ship the first usable knowledge workspace without AI generation: upload, organize, browse, and search files.

## Scope

- File upload
- Library
- Projects
- Folders
- File viewer
- Search UI

## Tickets

### LIB-001 - File Upload and Library Baseline

- **Epic**: Epic 2 - Knowledge Workspace
- **Status**: Done
- **Product Specification**: Users can upload files and view them in a searchable library list.
- **UX Specification**: `docs/06-wireframes/01-ux-specification.md` (Library, Document Viewer)
- **Database Changes**: none (storage-backed baseline in Sprint 2.1)
- **API Contract**:
  - `GET /api/v1/workspaces/{workspaceId}/sources`
  - `POST /api/v1/workspaces/{workspaceId}/sources`
  - `GET /api/v1/workspaces/{workspaceId}/sources/{sourceId}`
- **Acceptance Criteria**:
  1. Authenticated user can upload a file.
  2. Uploaded file appears in library list.
  3. User can filter list with search query.
  4. User can open file viewer from list.
  5. Route protection enforces auth on library and workspace APIs.
- **Definition of Done**:
  - Library page implemented.
  - Viewer page implemented.
  - Storage helper and routes implemented.
  - Backlog updated with status and artifacts.
- **Tests**:
  - Upload route contract test.
  - Library page render and search smoke test.
- **Dependencies**:
  - AUTH-001
  - AUTH-002

## Artifacts

- `docs/03-database/migrations/0002_sources_library_metadata.sql`
- `apps/web/app/library/page.tsx`
- `apps/web/app/library/[sourceId]/page.tsx`
- `apps/web/app/api/v1/workspaces/[workspaceId]/sources/route.ts`
- `apps/web/app/api/v1/workspaces/[workspaceId]/sources/[sourceId]/route.ts`
- `apps/web/app/api/v1/workspaces/[workspaceId]/projects/route.ts`
- `apps/web/app/api/v1/workspaces/[workspaceId]/projects/[projectId]/route.ts`
- `apps/web/app/api/v1/workspaces/[workspaceId]/projects/[projectId]/folders/route.ts`
- `apps/web/app/api/v1/workspaces/[workspaceId]/folders/[folderId]/route.ts`
- `apps/web/lib/storage/library.ts`
- `apps/web/lib/storage/workspace-taxonomy.ts`
- `docs/03-database/migrations/0003_projects_folders_first_class.sql`

### LIB-002 - Library Metadata Persistence

- **Epic**: Epic 2 - Knowledge Workspace
- **Status**: Done
- **Product Specification**: Uploaded files persist metadata in PostgreSQL for stable querying by workspace/project/folder.
- **UX Specification**: `docs/06-wireframes/01-ux-specification.md` (Library, Document Viewer)
- **Database Changes**:
  - Add library metadata columns to `sources`.
  - Add workspace/project/folder indexes.
  - Migration spec: `docs/03-database/migrations/0002_sources_library_metadata.sql`
- **API Contract**:
  - Existing sources endpoints keep contract unchanged.
  - Implementation now writes and reads metadata via `sources` table where available.
- **Acceptance Criteria**:
  1. Upload persists source metadata in DB (with safe fallback).
  2. Library list reads from DB when available.
  3. Viewer resolves source details via DB when available.
  4. Feature remains functional if DB schema is not yet migrated (storage fallback).
- **Definition of Done**:
  - Storage helper upgraded for DB persistence.
  - Migration spec added.
  - Ticket board updated.
- **Tests**:
  - Upload persistence contract test.
  - List/detail fallback behavior test.
- **Dependencies**:
  - LIB-001

### LIB-003 - Projects and Folders as First-Class Entities

- **Epic**: Epic 2 - Knowledge Workspace
- **Status**: Done
- **Product Specification**: Users manage explicit project/folder entities and attach uploads to those entities.
- **UX Specification**: `docs/06-wireframes/01-ux-specification.md` (Library)
- **Database Changes**:
  - Add `projects` and `folders` tables.
  - Add optional `project_id` and `folder_id` references on `sources`.
  - Migration spec: `docs/03-database/migrations/0003_projects_folders_first_class.sql`
- **API Contract**:
  - `GET|POST /api/v1/workspaces/{workspaceId}/projects`
  - `GET|PATCH|DELETE /api/v1/workspaces/{workspaceId}/projects/{projectId}`
  - `GET|POST /api/v1/workspaces/{workspaceId}/projects/{projectId}/folders`
  - `GET|PATCH|DELETE /api/v1/workspaces/{workspaceId}/folders/{folderId}`
  - `POST /api/v1/workspaces/{workspaceId}/sources` now accepts `projectId` and `folderId`.
- **Acceptance Criteria**:
  1. User can create/list projects from the Library UI.
  2. User can create/list folders scoped to a project.
  3. Upload flow uses project and folder entities (ID-backed) instead of free-text only.
  4. API exposes CRUD contract for projects and folders.
- **Definition of Done**:
  - Workspace taxonomy helper implemented.
  - Projects/folders API routes implemented.
  - Library UI wired to projects/folders endpoints.
  - Backlog and migration artifacts updated.
- **Tests**:
  - Project/folder API contract test.
  - Library upload contract test with `projectId` + `folderId`.
- **Dependencies**:
  - LIB-002

### LIB-004 - Library Taxonomy Management UX

- **Epic**: Epic 2 - Knowledge Workspace
- **Status**: Done
- **Product Specification**: Users can filter library results by project/folder and manage taxonomy entities (rename/delete) directly from the Library.
- **UX Specification**: `docs/06-wireframes/01-ux-specification.md` (Library)
- **Database Changes**: none
- **API Contract**:
  - Uses existing `projects`/`folders` CRUD endpoints from LIB-003.
  - No contract-breaking changes.
- **Acceptance Criteria**:
  1. Library list can be filtered by project and folder.
  2. User can rename a selected project from Library page.
  3. User can delete a selected project from Library page.
  4. User can rename/delete selected folder from Library page.
  5. Library refreshes appropriately after taxonomy mutations.
- **Definition of Done**:
  - Library page includes project/folder filters.
  - Library page includes rename/delete controls for project and folder.
  - Existing upload/list behaviors remain intact.
- **Tests**:
  - Library filter behavior smoke test.
  - Project/folder mutation UX contract test.
- **Dependencies**:
  - LIB-003

### LIB-005 - Library Table UX Hardening

- **Epic**: Epic 2 - Knowledge Workspace
- **Status**: Done
- **Product Specification**: Improve browsing ergonomics with pagination, sorting, stronger empty/error states, and optimistic feedback for taxonomy mutations.
- **UX Specification**: `docs/06-wireframes/01-ux-specification.md` (Library)
- **Database Changes**: none
- **API Contract**: no new endpoints; uses existing `sources`, `projects`, and `folders` endpoints.
- **Acceptance Criteria**:
  1. User can sort library rows by key columns (name/project/folder/size/updated).
  2. User can paginate large result sets from the table.
  3. Empty states differentiate between "no data" and "no results after filters".
  4. Error state provides explicit retry action.
  5. Taxonomy create/rename/delete flows update UI optimistically and show user feedback.
- **Definition of Done**:
  - Library table pagination + sorting implemented.
  - Improved empty/error/info feedback states implemented.
  - Optimistic UX behavior added for project/folder mutations.
- **Tests**:
  - Library table sorting/pagination smoke test.
  - Optimistic project/folder mutation behavior test.
- **Dependencies**:
  - LIB-004

### LIB-006 - Source Row Management Actions

- **Epic**: Epic 2 - Knowledge Workspace
- **Status**: Done
- **Product Specification**: Users can rename, move, and delete individual sources directly from the library table.
- **UX Specification**: `docs/06-wireframes/01-ux-specification.md` (Library, Document Viewer)
- **Database Changes**: none
- **API Contract**:
  - `PATCH /api/v1/workspaces/{workspaceId}/sources/{sourceId}` (rename/move metadata updates)
  - `DELETE /api/v1/workspaces/{workspaceId}/sources/{sourceId}`
- **Acceptance Criteria**:
  1. Each source row exposes rename, move, and delete actions.
  2. Rename and move update row data with optimistic UX and rollback on failure.
  3. Delete removes row optimistically and confirms destructive action.
  4. API handlers enforce auth and workspace scoping.
  5. Library feedback messaging reflects action outcomes.
- **Definition of Done**:
  - Source PATCH/DELETE handlers implemented.
  - Storage helper supports source metadata update and deletion.
  - Library table wired with source action controls.
- **Tests**:
  - Source PATCH/DELETE API contract tests.
  - Library source-action optimistic behavior test.
- **Dependencies**:
  - LIB-005

### LIB-007 - Source Action Form UX

- **Epic**: Epic 2 - Knowledge Workspace
- **Status**: Done
- **Product Specification**: Replace prompt-driven source rename/move flows with structured inline form UX using project/folder selectors and validation.
- **UX Specification**: `docs/06-wireframes/01-ux-specification.md` (Library)
- **Database Changes**: none
- **API Contract**: no new endpoints; uses `PATCH /sources/{sourceId}` from LIB-006.
- **Acceptance Criteria**:
  1. Rename source uses inline form instead of browser prompt.
  2. Move source uses project/folder selectors instead of free-text prompt.
  3. Validation prevents empty rename and incomplete move submissions.
  4. Save/cancel controls are visible and action state is explicit.
  5. Existing optimistic update + rollback behavior remains intact.
- **Definition of Done**:
  - Source editor panel implemented for rename/move.
  - Project/folder selector flow wired for move action.
  - Prompt-based rename/move interactions removed.
- **Tests**:
  - Source editor validation and submit behavior smoke test.
  - Move flow selector loading behavior test.
- **Dependencies**:
  - LIB-006

### LIB-008 - Source Deletion Modal and Batch Actions

- **Epic**: Epic 2 - Knowledge Workspace
- **Status**: Done
- **Product Specification**: Add explicit in-page delete confirmation for sources and enable multi-select batch move/delete workflows.
- **UX Specification**: `docs/06-wireframes/01-ux-specification.md` (Library)
- **Database Changes**: none
- **API Contract**: no new endpoints; reuses `PATCH/DELETE /api/v1/workspaces/{workspaceId}/sources/{sourceId}`.
- **Acceptance Criteria**:
  1. Source delete uses an in-page confirmation modal instead of `window.confirm`.
  2. Users can multi-select source rows on current page.
  3. Users can batch move selected sources using project/folder selectors.
  4. Users can batch delete selected sources with confirmation.
  5. Optimistic UI and rollback behavior remain intact for batch operations.
- **Definition of Done**:
  - Selection column and selection controls implemented.
  - Batch move/delete control panel implemented.
  - Confirmation modal implemented for single and bulk deletes.
- **Tests**:
  - Source selection and bulk action smoke test.
  - Delete confirmation modal flow test.
- **Dependencies**:
  - LIB-007

### LIB-009 - Taxonomy Form UX Parity

- **Epic**: Epic 2 - Knowledge Workspace
- **Status**: Done
- **Product Specification**: Replace prompt/confirm project and folder management flows with structured in-page form/confirmation interactions.
- **UX Specification**: `docs/06-wireframes/01-ux-specification.md` (Library)
- **Database Changes**: none
- **API Contract**: no new endpoints; reuses existing projects/folders CRUD routes.
- **Acceptance Criteria**:
  1. Project create/rename/delete no longer use browser prompts/confirms.
  2. Folder create/rename/delete no longer use browser prompts/confirms.
  3. Taxonomy actions run via in-page editor panel with clear confirm/cancel controls.
  4. Optimistic behavior and rollback safety remain intact for taxonomy updates.
  5. Existing source management features remain functional.
- **Definition of Done**:
  - Unified taxonomy editor panel implemented.
  - Prompt/confirm interactions removed from taxonomy actions.
  - Sprint backlog updated with ticket and snapshot.
- **Tests**:
  - Taxonomy editor create/rename/delete smoke test.
  - Taxonomy rollback behavior regression test.
- **Dependencies**:
  - LIB-008

### LIB-010 - Destructive Flow Hardening

- **Epic**: Epic 2 - Knowledge Workspace
- **Status**: Done
- **Product Specification**: Add dependency-aware warnings before taxonomy deletion and provide an undo window for source deletions.
- **UX Specification**: `docs/06-wireframes/01-ux-specification.md` (Library)
- **Database Changes**: none
- **API Contract**: no new endpoints; reuses existing sources/projects/folders routes.
- **Acceptance Criteria**:
  1. Project/folder delete confirmations display counts of affected sources.
  2. Source deletes enter a short pending window before final deletion.
  3. User can undo pending source deletions before the timeout.
  4. Pending delete timeout finalizes cleanup via existing API routes.
  5. Error handling restores source state when delete finalization fails.
- **Definition of Done**:
  - Dependency-aware warning copy added to taxonomy delete flows.
  - Pending source delete queue + undo action implemented.
  - Timeout-based final deletion behavior implemented with rollback safety.
- **Tests**:
  - Delete warning count rendering test.
  - Pending delete undo/finalize behavior test.
- **Dependencies**:
  - LIB-009

### LIB-011 - Taxonomy Undo Safety

- **Epic**: Epic 2 - Knowledge Workspace
- **Status**: Done
- **Product Specification**: Bring project/folder delete flows to parity with source delete safety by adding pending-delete windows and undo.
- **UX Specification**: `docs/06-wireframes/01-ux-specification.md` (Library)
- **Database Changes**: none
- **API Contract**: no new endpoints; reuses existing `DELETE /projects/{id}` and `DELETE /folders/{id}` routes.
- **Acceptance Criteria**:
  1. Project delete enters a pending window with Undo before final API deletion.
  2. Folder delete enters a pending window with Undo before final API deletion.
  3. Pending taxonomy delete state is visible to user with explicit Undo action.
  4. Finalization failures restore prior project/folder state.
  5. Existing source undo/delete behavior remains functional.
- **Definition of Done**:
  - Pending taxonomy delete jobs + timers implemented.
  - Taxonomy undo action implemented.
  - Sprint board updated with new ticket and snapshot.
- **Tests**:
  - Project/folder pending delete undo behavior test.
  - Taxonomy finalize failure rollback test.
- **Dependencies**:
  - LIB-010

### LIB-012 - Pending Delete State Utilities

- **Epic**: Epic 2 - Knowledge Workspace
- **Status**: Done
- **Product Specification**: Extract pending-delete transition logic into reusable utilities and add deterministic tests for critical state transitions.
- **UX Specification**: `docs/06-wireframes/01-ux-specification.md` (Library)
- **Database Changes**: none
- **API Contract**: no changes
- **Acceptance Criteria**:
  1. Shared pending-delete helpers are centralized in a reusable module.
  2. Source/taxonomy pending-delete flows consume shared helpers for ids, selection transforms, and active-job checks.
  3. Pending-delete timeout value is centralized and reused.
  4. Deterministic tests cover helper transitions (id generation, selection updates, active job checks).
  5. Library behavior remains unchanged from user perspective.
- **Definition of Done**:
  - Pending-delete utility module added.
  - Library page refactored to use utility functions.
  - Utility tests added and referenced in backlog.
- **Tests**:
  - Utility transition tests in `apps/web/lib/library/pending-delete.test.ts`.
- **Dependencies**:
  - LIB-011

### LIB-013 - Web Test Runner Baseline

- **Epic**: Epic 2 - Knowledge Workspace
- **Status**: Done
- **Product Specification**: Establish a runnable web-package test command and regression coverage for pending-delete transitions.
- **UX Specification**: N/A (engineering quality ticket)
- **Database Changes**: none
- **API Contract**: no changes
- **Acceptance Criteria**:
  1. `@aproko/web` package exposes a runnable `test` script.
  2. Monorepo root can execute tests through Turborepo.
  3. Pending-delete utility tests run under the configured test command.
  4. Transition regression checks include queue/undo/finalize behaviors.
  5. Test command execution output confirms passing tests.
- **Definition of Done**:
  - `apps/web/package.json` includes `test` script.
  - root `package.json` and `turbo.json` include `test` orchestration.
  - pending-delete regression tests updated and passing.
- **Tests**:
  - `pnpm --filter @aproko/web test`
- **Dependencies**:
  - LIB-012

### LIB-014 - Library API Contract Tests

- **Epic**: Epic 2 - Knowledge Workspace
- **Status**: Done
- **Product Specification**: Add integration-style contract tests for core Library API routes using dependency-injected handlers and mocked dependencies.
- **UX Specification**: N/A (engineering quality ticket)
- **Database Changes**: none
- **API Contract**:
  - `GET|POST /api/v1/workspaces/{workspaceId}/sources`
  - `PATCH /api/v1/workspaces/{workspaceId}/sources/{sourceId}`
  - `POST /api/v1/workspaces/{workspaceId}/projects`
  - `POST /api/v1/workspaces/{workspaceId}/projects/{projectId}/folders`
- **Acceptance Criteria**:
  1. Route handlers expose testable dependency-injected constructors for contract tests.
  2. Unauthorized and validation scenarios are covered for core Library routes.
  3. Success path payload/status contracts are covered for key creation endpoints.
  4. Source route contract verifies project/folder slug resolution precedence.
  5. Web test command runs route contract tests successfully.
- **Definition of Done**:
  - Route handler factories added for targeted endpoints.
  - API contract test file added and passing.
  - Sprint board updated with ticket and snapshot.
- **Tests**:
  - `pnpm --filter @aproko/web test`
  - `apps/web/lib/library/api-routes.test.ts`
- **Dependencies**:
  - LIB-013

### LIB-015 - By-ID Route Contract Completion

- **Epic**: Epic 2 - Knowledge Workspace
- **Status**: Done
- **Product Specification**: Complete contract coverage for by-id API routes and backend error paths.
- **UX Specification**: N/A (engineering quality ticket)
- **Database Changes**: none
- **API Contract**:
  - `GET|PATCH|DELETE /api/v1/workspaces/{workspaceId}/projects/{projectId}`
  - `GET|PATCH|DELETE /api/v1/workspaces/{workspaceId}/folders/{folderId}`
  - `GET|DELETE /api/v1/workspaces/{workspaceId}/sources/{sourceId}`
- **Acceptance Criteria**:
  1. By-id project/folder routes expose dependency-injected testable handlers.
  2. Route contract tests cover 404/400/500 scenarios for by-id routes.
  3. Source by-id GET/DELETE contract paths are covered.
  4. Expanded web test suite passes with all contract tests.
- **Definition of Done**:
  - Route handler factories added for project/folder by-id endpoints.
  - API contract tests expanded and passing in web test runner.
- **Tests**:
  - `pnpm --filter @aproko/web test`
  - `apps/web/lib/library/api-routes.test.ts`
- **Dependencies**:
  - LIB-014

## Sprint 02 Exit Snapshot

- Sprint 02 overall status: ✅ Complete (all LIB tickets done)
- LIB-001: Done
- LIB-002: Done
- LIB-003: Done
- LIB-004: Done
- LIB-005: Done
- LIB-006: Done
- LIB-007: Done
- LIB-008: Done
- LIB-009: Done
- LIB-010: Done
- LIB-011: Done
- LIB-012: Done
- LIB-013: Done
- LIB-014: Done
- LIB-015: Done
