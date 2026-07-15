# Sprint 01 CI/CD Baseline

## Workflow Files

- `.github/workflows/ci.yml`
- `.github/workflows/vercel-deploy.yml`

## Required GitHub Secrets

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID` (`team_XPrDJ8LPdaaxg5i2UCeUI8kx`)
- `VERCEL_PROJECT_ID` (`prj_lW2ZJfO8hTyTtYrWh6cT6IVuZaKl` for `aproko-ai-web`)

## Pipeline Behavior

- Pull requests: run CI checks and create Vercel preview deployment.
- Main branch: run CI checks and deploy production artifacts.

## Vercel Notes

- `vercel pull` is required before build to hydrate environment values.
- `vercel build` + `vercel deploy --prebuilt` keeps CI deterministic.

## Verification Checklist

1. Open PR and confirm CI + preview deploy jobs pass.
2. Merge to `main` and confirm production deployment completes.
3. Confirm app routes (`/`, `/sign-in`, `/sign-up`, `/dashboard`) are reachable.
