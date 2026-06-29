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
- **Status**: In Review
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
- **Status**: In Review
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
- **Status**: In Review
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
- **Status**: In Review
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
- **Status**: In Review
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
- **Status**: In Review
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

## Sprint 02 Exit Snapshot

- LIB-001: Done
- LIB-002: In Review
- LIB-003: In Review
- LIB-004: In Review
- LIB-005: In Review
- LIB-006: In Review
- LIB-007: In Review
