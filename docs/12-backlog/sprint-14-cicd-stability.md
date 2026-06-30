# Sprint 14 - CI/CD Stability

## Status

- **Current ticket:** `CICD-002`
- **State:** Done

## Ticket: CICD-002 - Resolve GitHub Action pnpm Version Conflict

### Product Spec

Unblock CI and Vercel deploy workflows by resolving the `pnpm/action-setup` version conflict against the repository `packageManager` setting.

### Scope

- Inspect latest failed GitHub workflow runs.
- Identify and fix root cause in workflow configuration.
- Align workflow pnpm version with root `package.json` package manager.
- Update backlog status for Sprint 1 CI/CD baseline.

### Root Cause

- Both `CI` and `Vercel Deploy` workflows failed at setup step with:
  - "Multiple versions of pnpm specified"
  - action requested `version: 9`, while project declared `pnpm@9.12.3`.

### Fix

- Updated:
  - `.github/workflows/ci.yml`
  - `.github/workflows/vercel-deploy.yml`
- Set `pnpm/action-setup` `version` to `9.12.3`.

### Acceptance Criteria

- Workflow config no longer contains conflicting pnpm version declarations.
- Root-cause mismatch is resolved in repository code.
- Sprint 1 CI/CD ticket moved out of review state.

### Definition of Done

- Workflow files updated.
- Evidence of failure root cause captured from `gh run view` logs.
- Backlog documentation updated.

### Artifacts

- `.github/workflows/ci.yml`
- `.github/workflows/vercel-deploy.yml`
- `docs/12-backlog/sprint-01-foundation.md`
