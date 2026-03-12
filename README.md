# Tether — Personal Appointment & Task Manager

A web-based application for managing appointments and personal tasks in one place. Quick entry for appointments from phone calls, emails, or notes.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (Supabase or Neon)
- **Auth:** Supabase Auth
- **Email:** Resend
- **ORM:** Prisma
- **Job queue:** Inngest (appointment reminders)
- **Hosting:** Vercel

## Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- PostgreSQL database (Supabase or Neon)
- [Resend](https://resend.com) account
- [Inngest](https://inngest.com) account (for scheduled reminders)
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

   For appointment reminders (Inngest), run the Inngest dev server in another terminal:

   ```bash
   npx inngest-cli@latest dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes* | For reminder emails (fetches user email) |
| `RESEND_API_KEY` | Yes | Resend API key for emails |
| `RESEND_FROM_EMAIL` | No | Sender (default: Resend onboarding) |
| `NEXT_PUBLIC_APP_URL` | Yes | App URL (e.g. `http://localhost:3000`) |
| `INNGEST_SIGNING_KEY` | Yes* | Inngest signing key (*production) |
| `INNGEST_EVENT_KEY` | Yes* | Inngest event key (*production) |

See [.env.example](.env.example) for the full list.

## CI (GitHub Actions)

The CI pipeline runs on every push and PR to `main`. Add these secrets in **Settings → Secrets and variables → Actions**:

| Secret | Required | Description |
|--------|----------|-------------|
| `DATABASE_URL` | Yes | Supabase pooler URL with `?pgbouncer=true` for serverless/CI |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `TEST_USER_EMAIL` | For E2E | Test user email (7 tests skip if unset) |
| `TEST_USER_PASSWORD` | For E2E | Test user password |

Without `TEST_USER_EMAIL` / `TEST_USER_PASSWORD`, the build and lint still run; E2E runs 3 auth tests and skips 7.

## Deployment (Vercel)

1. **Import project**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repo
   - Vercel auto-detects Next.js; build command `prisma generate && next build` is already in `package.json`

2. **Add environment variables** (Project Settings → Environment Variables)

   | Variable | Required | Notes |
   |----------|----------|-------|
   | `DATABASE_URL` | Yes | Use Supabase **pooler** URL; append `?pgbouncer=true` (auto-added for pooler URLs) |
   | `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase → Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase → Settings → API |
   | `SUPABASE_SERVICE_ROLE_KEY` | Yes | For reminder cron (user email lookup) |
   | `RESEND_API_KEY` | Yes | Resend dashboard |
   | `RESEND_FROM_EMAIL` | No | Default: `onboarding@resend.dev` |
   | `NEXT_PUBLIC_APP_URL` | Yes | Your Vercel URL, e.g. `https://tether-xxx.vercel.app` |
   | `CRON_SECRET` | Yes | Generate: `openssl rand -hex 32` |

3. **Configure Supabase**
   - Supabase Dashboard → Authentication → URL Configuration
   - Set Site URL: `https://your-app.vercel.app`
   - Add Redirect URLs: `https://your-app.vercel.app/**` and `https://your-app.vercel.app/auth/reset-password`

4. **Run migrations** (first deploy only)
   ```bash
   DATABASE_URL="your-production-url" pnpm prisma migrate deploy
   ```

5. **Deploy** — Each push to `main` deploys. Cron runs daily at 9:00 AM UTC via `vercel.json` (Hobby plan limit; Pro allows more frequent runs).

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
