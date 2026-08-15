# Sprint 27 — Live Paddle Billing

## Status

- **State:** Implemented (web)
- **Provider:** Paddle (Stripe fallback via `BILLING_PROVIDER=stripe`)

## Goal

Enable live Paddle checkout and webhook persistence.

## Scope

- Migration: `202608141200_create_billing_tables.sql`
- Vercel env: `BILLING_PROVIDER=paddle`, `PADDLE_*`, price IDs
- Paddle webhook → `/api/v1/billing/webhooks` (`paddle-signature` header)
- Checkout via Paddle Billing transactions API (`checkout.url`)
- Smoke test: checkout → subscription on `/billing`

## Vercel env checklist

| Variable | Purpose |
|----------|---------|
| `BILLING_PROVIDER` | `paddle` |
| `PADDLE_API_KEY` | Server API key (sandbox or live) |
| `PADDLE_WEBHOOK_SECRET` | Notification secret from Paddle dashboard |
| `PADDLE_ENVIRONMENT` | `sandbox` or `production` |
| `PADDLE_PRICE_TEAMS` | Paddle price ID |
| `PADDLE_PRICE_PRO_MONTHLY` | Paddle price ID |
| `PADDLE_PRICE_PRO_YEARLY` | Paddle price ID |
| `NEXT_PUBLIC_APP_URL` | Approved checkout domain base (e.g. `https://aprokoai.vercel.app`) |

## Paddle dashboard setup

1. Create products/prices for Teams, Pro monthly, Pro yearly.
2. Set **Default payment link** to `https://aprokoai.vercel.app/billing` (or your production URL).
3. Add webhook destination: `https://aprokoai.vercel.app/api/v1/billing/webhooks`
4. Subscribe to: `subscription.activated`, `subscription.updated`, `subscription.canceled`

## Out of scope

- Usage metering, plan feature gates, Customer Portal
