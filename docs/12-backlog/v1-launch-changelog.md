# Aproko AI V1 — Launch Changelog

**Release date:** July 2026  
**Production URL:** https://aprokoai.vercel.app  
**Status:** Web V1 (individual & team knowledge workflows)

---

## Summary

Aproko AI V1 is a web-first AI knowledge operating system. Upload your sources, chat with grounded answers and citations, and turn material into notes, study assets, and research outputs — all in one workspace.

---

## What's new

### Knowledge & chat

- **Library** — Upload and organize PDFs, documents, text, and media by project and folder
- **AI chat** — Ask questions over your workspace with retrieval-grounded responses and citations
- **Memory** — Capture and embed memory items for longer-term context
- **Search** — Find content across your workspace
- **Research workspace** — Collect and manage research sources in dedicated workspaces

### Study & synthesis

- **Study tools** — Generate and review flashcards and quizzes from your material
- **Summaries & notes** — Create and manage notes tied to your knowledge base
- **Transcripts** — Upload meeting transcripts for processing and review

### Account & platform

- **Authentication** — Sign up and sign in via Clerk (email and OAuth where enabled)
- **Dashboard** — Central hub after sign-in
- **Settings** — Profile and workspace preferences
- **Billing** — Subscription and checkout flows (Stripe when configured)
- **Admin** — Usage and user oversight for platform admins

### Marketing & trust

- Landing page, blog, privacy policy, and terms

---

## Technical highlights (engineering)

- Next.js 16 App Router with partial prerendering
- Clerk authentication and protected routes
- Supabase PostgreSQL and Storage for persistence
- Sentry error monitoring in production
- GitHub Actions CI + automated Vercel deploys on `main`
- Rate limiting on sensitive API routes (billing, profile, workspace writes)

---

## Known limitations (V1)

- **Web only** — No native desktop or mobile apps in V1
- **Billing** — Requires Stripe keys and price IDs in production for live checkout
- **PostHog** — Product analytics optional until `POSTHOG_API_KEY` is configured
- **Viewer role** — Can chat and search; cannot create or edit artifacts (notes, uploads, flashcards)
- **Compliance** — GDPR-ready deletion flows documented; SOC 2 / HIPAA not in V1 scope unless contracted

---

## Getting started

1. Go to https://aprokoai.vercel.app/sign-up
2. Create an account
3. Upload your first file in **Library**
4. Open **Chat** and ask a question about your material
5. Explore **Memory**, **Study**, and **Research** for deeper workflows

---

## Feedback & support

- **Issues:** Use your team’s support channel or GitHub Issues (if public)
- **Incidents:** See `docs/11-deployment/02-release-operations-runbook.md`

---

## Publish checklist (copy to GitHub Release / blog / email)

- [ ] Replace “July 2026” with exact launch date
- [ ] Add support email or contact link
- [ ] Post to GitHub Releases (`v1.0.0` tag optional)
- [ ] Optional: add a blog post at `/blog` using content from **Summary** and **What's new**
- [ ] Announce on social / newsletter
- [ ] Schedule 24–72h post-launch monitoring window

---

## Suggested GitHub Release title

**Aproko AI V1 — Your AI knowledge operating system**

## Suggested one-liner (social)

> Aproko AI V1 is live: upload your sources, chat with citations, and build memory and study tools in one workspace. https://aprokoai.vercel.app
