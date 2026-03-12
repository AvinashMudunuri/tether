# Tether — Personal Appointment & Task Manager

A web-based application for managing appointments and personal tasks in one place. Quick entry for appointments from phone calls, emails, or notes.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (Supabase or Neon)
- **Auth:** Supabase Auth
- **Email:** Resend
- **ORM:** Prisma
- **Hosting:** Vercel

## Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- PostgreSQL database (Supabase or Neon)
- [Resend](https://resend.com) account
- [Vercel](https://vercel.com) account (for deployment)

## Setup

1. **Clone and install**

   ```bash
   git clone <repository-url>
   cd tether
   pnpm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env` and fill in the values:

   ```bash
   cp .env.example .env
   ```

3. **Database**

   - Create a PostgreSQL database (Supabase or Neon)
   - Add `DATABASE_URL` to `.env`
   - Run migrations:

   ```bash
   pnpm prisma migrate dev
   ```

4. **Run locally**

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes* | For reminder cron (fetches user email) |
| `RESEND_API_KEY` | Yes | Resend API key for emails |
| `RESEND_FROM_EMAIL` | No | Sender (default: Resend onboarding) |
| `NEXT_PUBLIC_APP_URL` | Yes | App URL (e.g. `http://localhost:3000`) |
| `CRON_SECRET` | Yes* | For Vercel cron auth (*production only) |

See [.env.example](.env.example) for the full list.

## Deployment (Vercel)

1. Push to GitHub and import in Vercel
2. Add all environment variables in Project Settings
3. Deploy — cron is configured in `vercel.json` (runs every 15 min)

## Testing

```bash
# Run E2E tests (requires dev server or set PLAYWRIGHT_BASE_URL)
pnpm test:e2e

# With UI
pnpm test:e2e:ui
```

Create a test account in Supabase, then set `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` in `.env` or when running:

```bash
TEST_USER_EMAIL=your@email.com TEST_USER_PASSWORD=yourpassword pnpm test:e2e
```

Auth tests (redirect, login/signup links) run without credentials. Appointments, tasks, and calendar tests require a valid test user.

## Documentation

- [Product Requirements (PRD)](docs/PRD.md)
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md)
- [Runbook](docs/RUNBOOK.md)

## Common Issues

| Issue | Solution |
|-------|----------|
| Database connection fails | Verify `DATABASE_URL` format; use pooler URL for serverless |
| Auth errors | Check Supabase URL/keys; add site URL in Supabase dashboard |
| Emails not sending | Verify Resend API key; check domain verification |
| Cron not running | Set `CRON_SECRET` in Vercel; verify `vercel.json` cron config |
| Reminders not sent | Ensure `SUPABASE_SERVICE_ROLE_KEY` is set |
