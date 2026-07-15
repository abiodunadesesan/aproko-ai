# Launch Checklist: Clerk Redirects & Supabase Storage

Use this guide before V1 go-live. Production URL: **https://aprokoai.vercel.app**

## Clerk redirect URLs

Clerk controls where users are sent after sign-in, sign-up, and OAuth. If these URLs are wrong, users see **“redirect URL not allowed”** or get sent to localhost.

### Where to configure

1. Open [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your **production** Clerk application (the one whose keys are in Vercel Production env)
3. Go to **Configure → Paths** (or **Domains** depending on Clerk UI version)

### Required settings

| Setting           | Value                                   |
| ----------------- | --------------------------------------- |
| Home URL          | `https://aprokoai.vercel.app`           |
| Sign-in URL       | `https://aprokoai.vercel.app/sign-in`   |
| Sign-up URL       | `https://aprokoai.vercel.app/sign-up`   |
| After sign-in URL | `https://aprokoai.vercel.app/dashboard` |
| After sign-up URL | `https://aprokoai.vercel.app/dashboard` |

### Allowed redirect / callback URLs

Add these under **Redirect URLs** (or **Allowed redirect URLs**):

```
https://aprokoai.vercel.app
https://aprokoai.vercel.app/*
https://aprokoai.vercel.app/sign-in
https://aprokoai.vercel.app/sign-up
https://aprokoai.vercel.app/dashboard
https://aprokoai.vercel.app/sign-in/sso-callback
https://aprokoai.vercel.app/sign-up/sso-callback
```

Keep `http://localhost:3000` and `http://localhost:3000/*` for local development.

### OAuth (Google)

If Google sign-in is enabled:

1. **Clerk** → **Configure → SSO connections → Google** — ensure production is enabled
2. **Google Cloud Console** → OAuth client → **Authorized redirect URIs** must include Clerk’s callback URL shown in the Clerk Google setup page (format like `https://<your-clerk-domain>/v1/oauth_callback`)

### Vercel env vars (already in app)

These should match production (see `apps/web/.env.example`):

```env
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/dashboard
NEXT_PUBLIC_APP_URL=https://aprokoai.vercel.app
```

Add `NEXT_PUBLIC_APP_URL` on Vercel Production if not set:

```bash
cd apps/web
printf '%s' 'https://aprokoai.vercel.app' | vercel env add NEXT_PUBLIC_APP_URL production
```

### Verify Clerk

1. Open https://aprokoai.vercel.app/sign-in in an incognito window
2. Sign in with email or Google
3. Confirm you land on `/dashboard` (not an error page)
4. Refresh `/dashboard` — session should persist
5. Sign out and confirm protected routes redirect to sign-in

---

## Supabase storage & CORS

Library uploads go through your **Next.js API** (server uses `SUPABASE_SERVICE_ROLE_KEY`). Viewing files uses **signed URLs** in the browser (`/library/[sourceId]`).

Bucket name (default): **`aproko-library`** (`SUPABASE_LIBRARY_BUCKET` env override if set).

### 1. Confirm bucket exists

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. **Storage** → confirm bucket **`aproko-library`** exists
3. If missing, create it as **Private** (not public)

### 2. API CORS (project level)

1. **Project Settings → API**
2. Under **CORS** / **Additional allowed origins**, add:

```
https://aprokoai.vercel.app
http://localhost:3000
```

This allows browser requests from your app domain to Supabase REST/Storage APIs when needed.

### 3. Storage policies (RLS)

Uploads use the service role on the server, but signed URLs still require correct bucket access rules.

In **Storage → aproko-library → Policies**, ensure authenticated/service access is configured for your workspace paths. Minimum checks:

- Service role can **insert** and **select** objects under workspace prefixes
- Signed URL generation (`createSignedUrl`) succeeds for objects the user owns

If uploads fail with **403** or **RLS policy** errors, add or adjust policies for the `aproko-library` bucket.

Example policy intent (adjust to your schema):

- **INSERT**: authenticated users can upload to paths matching their workspace prefix
- **SELECT**: authenticated users can read objects in their workspace prefix

Use the Supabase SQL editor or Policy UI; test with a real upload after changes.

### 4. Optional: env on Vercel

```env
NEXT_PUBLIC_SUPABASE_URL=<your-project-url>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_LIBRARY_BUCKET=aproko-library
```

These should already be set on Vercel Production from earlier setup.

### Verify Supabase

1. Sign in on https://aprokoai.vercel.app
2. Go to **Library** → upload a small `.txt` or `.pdf` file
3. Confirm success toast and file appears in the sources table
4. Open the file detail page — preview or download link should load (signed URL)
5. If preview fails, open browser DevTools → **Network** and look for CORS or 403 on storage URLs

---

## Quick troubleshooting

| Symptom                             | Likely cause                     | Fix                                                    |
| ----------------------------------- | -------------------------------- | ------------------------------------------------------ |
| “Redirect URL not allowed”          | Clerk redirect list              | Add production URLs above                              |
| Sign-in loops or lands on localhost | Wrong Clerk instance or env keys | Use production Clerk keys on Vercel Production         |
| Upload returns 401                  | Auth/session                     | Check Clerk production keys and middleware             |
| Upload returns 500                  | Storage bucket / RLS             | Verify `aproko-library` bucket and policies            |
| File preview blank / CORS error     | Storage CORS or signed URL       | Add origin in Supabase API CORS; check bucket policies |

---

## Cross references

- Release checklist: `docs/12-backlog/release-v1-checklist.md`
- Operations runbook: `docs/11-deployment/02-release-operations-runbook.md`
- V1 changelog draft: `docs/12-backlog/v1-launch-changelog.md`
