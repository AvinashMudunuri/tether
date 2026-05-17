# Tetherly — Runbook

Quick reference for common operations and troubleshooting.

## Deployment (Vercel)

1. Connect repo to Vercel
2. Set environment variables (see below)
3. Deploy — Vercel auto-detects Next.js
4. Cron runs daily at 9:00 AM UTC via `vercel.json` (Hobby plan: 1/day; Pro: unlimited)

## Required Environment Variables

| Variable | Description | Where to get |
|----------|-------------|--------------|
| `DATABASE_URL` | PostgreSQL connection string | Supabase Dashboard → Settings → Database |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Dashboard → Settings → API |
| `RESEND_API_KEY` | Resend API key | Resend Dashboard |
| `RESEND_FROM_EMAIL` | Sender email (optional) | e.g. `Tetherly <noreply@yourdomain.com>` |
| `NEXT_PUBLIC_APP_URL` | Production URL | e.g. `https://your-app.vercel.app` |
| `CRON_SECRET` | Secret for cron auth | Generate random string; set in Vercel |
| `INNGEST_SIGNING_KEY` | Inngest webhook verification | Required in production; from Inngest dashboard |
| `UPSTASH_REDIS_REST_URL` | Rate limiting (optional) | Upstash Console |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limiting (optional) | Upstash Console |

## Common Issues

### Reminders not sending

- Check `SUPABASE_SERVICE_ROLE_KEY` is set (cron needs it to fetch user email)
- Check `RESEND_API_KEY` and domain verification in Resend
- Verify cron is enabled: Vercel Dashboard → Project → Settings → Cron Jobs
- Manually trigger: `curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-app.vercel.app/api/cron/reminders`

### Database connection errors

- Use connection pooler URL for serverless (Supabase: Transaction pooler)
- Format: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`

### Auth redirect loop

- Ensure `NEXT_PUBLIC_APP_URL` matches deployed URL
- Add site URL in Supabase Dashboard → Authentication → URL Configuration

## Database Migrations

```bash
# Create migration
pnpm prisma migrate dev --name migration_name

# Apply in production (after deploy)
pnpm prisma migrate deploy
```

## Health Check

`GET /api/health` — Returns `{ status: "ok", database: "connected" }` when healthy.

## Monitoring (Sentry)

- Add `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` to enable error tracking
- Errors from API routes, React components, and middleware are captured
- Tunnel route `/monitoring` routes Sentry traffic through the app (avoids ad-blockers)

**Source maps** (for readable stack traces in production): set `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` in your CI/Vercel build env. The auth token needs `project:releases` and `org:read` scopes.
