# Release Operations Runbook (V1)

## Scope

This runbook defines launch-day operations for Aproko AI Web V1:

- deployment verification
- rollback procedure
- incident triage
- support-facing data retention and deletion behavior

## Preconditions

- Main branch CI green (`lint`, `typecheck`, `test`, `e2e`, `build`)
- Production deployment available in Vercel
- Supabase migrations in sync with repository
- Clerk production config verified (keys, redirect URLs, OAuth)

## Production Smoke Verification

After each production deployment:

1. Open `/` and verify landing page renders.
2. Open `/sign-in` and verify Clerk sign-in UI renders.
3. Open `/dashboard` while signed out and verify auth guard behavior.
4. Sign in and verify navigation to:
   - `/dashboard`
   - `/library`
   - `/chat`
   - `/memory`
   - `/research`
5. Trigger one API-backed action per core area (create/read operation).

If any step fails, stop rollout and execute rollback.

## Rollback Procedure

### Fast rollback (preferred)

1. Identify last known healthy deployment in Vercel project history.
2. Promote/alias the previous healthy deployment to production.
3. Re-run smoke verification checks.
4. Communicate status in incident channel and update release log.

### Git rollback (if deployment promotion is unavailable)

1. Revert offending commit(s) on `main`.
2. Trigger CI and deploy pipeline.
3. Validate with smoke verification checks.

## Incident Response (Launch Week)

### Severity levels

- **P1**: Auth outage, global 5xx, data access failure
- **P2**: Core feature degraded, sustained latency spikes
- **P3**: Non-critical UI or workflow issues

### Triage sequence

1. Confirm user impact and blast radius.
2. Check Vercel deployment health and recent releases.
3. Check Sentry issue stream for correlated errors.
4. Check Supabase logs/health for DB and storage errors.
5. Apply fix or rollback based on time-to-recovery.

### Ownership

- **Engineering incident owner:** Repository owner / on-call engineer
- **Product escalation owner:** `TODO`
- **Support communications owner:** `TODO`

### Launch week monitoring (2026-07-15 → 2026-07-18)

- Check Sentry for new production issues daily.
- Check Vercel deployment health after each `main` push.
- Verify core routes: `/`, `/sign-in`, `/dashboard`, `/library`, `/chat`.

## Data Retention and Deletion (Support Baseline)

### Retention

- Application records are stored in Supabase PostgreSQL tables.
- Uploaded files and derived artifacts are stored in Supabase Storage.
- Operational telemetry is stored in Sentry/PostHog according to provider settings.

### Deletion behavior

- User-facing delete actions should remove or soft-delete records based on table policy.
- Storage objects linked to deleted entities must be deleted or lifecycle-managed.
- Audit and compliance-sensitive records should follow minimum retention requirements.

### Support process

1. Verify user identity through authenticated support workflow.
2. Identify target workspace/user scope.
3. Execute deletion request through approved admin flow/scripts.
4. Confirm completion and log request resolution.

`TODO`: finalize exact retention durations per data domain and publish in policy docs.

## Release Log Template

- Deployment ID:
- Commit SHA:
- Release owner:
- Start time:
- End time:
- Smoke result:
- Rollback required: yes/no
- Notes:
