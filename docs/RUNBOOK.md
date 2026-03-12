# Tether — Runbook

Quick reference for common operations and troubleshooting.

## Deployment (Vercel)

1. Connect repo to Vercel
2. Set environment variables (see below)
3. Deploy — Vercel auto-detects Next.js
4. Cron runs every 15 min via `vercel.json`

## Required Environment Variables

| Variable | Description | Where to get |
|----------|-------------|--------------|
| `DATABASE_URL` | PostgreSQL connection string | Supabase Dashboard → Settings → Database |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Dashboard → Settings → API |
| `RESEND_API_KEY` | Resend API key | Resend Dashboard |
| `RESEND_FROM_EMAIL` | Sender email (optional) | e.g. `Tether <noreply@yourdomain.com>` |
| `NEXT_PUBLIC_APP_URL` | Production URL | e.g. `https://your-app.vercel.app` |
| `CRON_SECRET` | Secret for cron auth | Generate random string; set in Vercel |

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
