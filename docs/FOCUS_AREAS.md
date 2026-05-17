# Tetherly — Focus Areas

Action plan for **Accessibility**, **Monitoring**, **Performance**, **Security**, and **Documentation**.

---

## 1. Accessibility (WCAG 2.1 AA)

**Current state:** Some ARIA usage and `tabIndex` across components; no formal audit.

### Checklist

| Item | Priority | Notes |
|------|----------|-------|
| Semantic HTML | High | Use `<main>`, `<nav>`, `<form>`, headings hierarchy |
| Form labels | High | All inputs must have visible or `aria-label` |
| Focus management | High | Modal focus trap, return focus on close |
| Keyboard navigation | High | Tab order, Enter/Space for buttons |
| Color contrast | Medium | Text ≥ 4.5:1, large text ≥ 3:1 |
| Screen reader announcements | Medium | Live regions for toasts, dynamic content |
| Skip links | Medium | "Skip to main content" on dashboard |
| Error messages | Low | Associate with inputs via `aria-describedby` |

### Key files to audit

- `src/components/notification-onboarding-modal.tsx` — focus trap
- `src/components/confirm-dialog.tsx` — focus trap
- `src/components/quick-capture-bar.tsx` — keyboard shortcuts
- Forms: login, signup, forgot-password, appointment/task creation
- `src/components/dashboard-nav.tsx` — nav landmarks

### Quick wins

- Add `lang="en"` to `<html>` in `src/app/layout.tsx`
- Ensure all `<button>` and `<input>` have accessible names
- Add `aria-live="polite"` to toast region (Sonner)

---

## 2. Monitoring ✓

**Current state:** Sentry integrated (client + server + edge); `logger` sends errors to Sentry; API routes use `logger.error`; `global-error.tsx` captures React errors.

### Implemented

- **Sentry:** `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts`
- **Logger:** `logger.error()` and `logger.warn()` capture to Sentry when `SENTRY_DSN` or `NEXT_PUBLIC_SENTRY_DSN` is set
- **API routes:** All `console.error` replaced with `logger.error` (attachments, parse-quick-capture, parse-task)
- **Global error boundary:** `app/global-error.tsx` captures unhandled React errors
- **Tunnel:** `/monitoring` route for Sentry (avoids ad-blockers); excluded from middleware

### Setup

1. Create a project at [sentry.io](https://sentry.io)
2. Add to `.env`: `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` (same value)
3. Optional (source maps): `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` in CI/Vercel

### Deferred

- Web Vitals / performance traces (sample rate already set)
- Correlation IDs for distributed traces

---

## 3. Performance

**Current state:** Standard Next.js 14 setup; no Lighthouse baseline.

### Checklist

| Item | Priority | Notes |
|------|----------|-------|
| Lighthouse audit | High | Run on production; target LCP < 2.5s |
| Image optimization | High | Use Next.js `Image` for any images |
| Font optimization | Medium | `next/font` if custom fonts |
| Bundle analysis | Medium | `@next/bundle-analyzer` |
| API/DB optimization | Medium | Prisma `select`, avoid N+1 |
| Static generation | Low | Pre-render auth pages where possible |

### Target metrics (PRD: page load < 3s)

- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- TTI < 3s

### Quick audit command

```bash
npx lighthouse https://your-app.vercel.app --view --output=html
```

### Key areas

- Dashboard page: multiple fetches; consider parallel or combined API
- Calendar view: may load many appointments; pagination or virtualization
- `expandRecurringAppointments` — ensure it’s not blocking

---

## 4. Security

**Current state:** Auth via Supabase (middleware + layout); API routes use `getAuthUser()`. File uploads validated (type, size). No Zod for API body validation.

### Checklist

| Item | Priority | Notes |
|------|----------|-------|
| API body validation | High | Zod schemas for POST/PUT bodies |
| Auth on all API routes | High | Verify `getAuthUser()` on every protected route |
| Input sanitization | High | No raw user input in SQL/HTML |
| Cron/secret protection | Medium | `CRON_SECRET` for cron endpoints |
| Attachment security | Medium | Validate content-type; consider virus scan |
| Rate limiting | Medium | Consider Vercel/Upstash or similar |
| Secrets in .env | Low | No secrets in client code |

### Security fixes applied (from audit)

- **Storage:** Path traversal fixed (extension from MIME whitelist); magic-byte validation for images; sanitized `fileName` stored in DB
- **Email:** HTML escaping for all user-controlled values (XSS prevention)
- **Supabase:** Env validation via `@/lib/env` (throws if missing)
- **Inngest:** Startup check fails if `INNGEST_SIGNING_KEY` missing in production
- **Rate limiting:** Auth (5/15min) and API (100/min) via Upstash when configured
- **Forgot-password:** Hardcoded URL removed; uses `getAppUrl()` from env

### API routes to validate (Zod - medium priority)

- `src/app/api/v1/appointments/route.ts` — POST body
- `src/app/api/v1/appointments/[id]/route.ts` — PUT body
- `src/app/api/v1/tasks/route.ts` — POST body
- `src/app/api/v1/tasks/[id]/route.ts` — PATCH body
- `src/app/api/v1/checklist/route.ts` — POST body
- `src/app/api/cron/reminders/route.ts` — CRON_SECRET

### Validation library

```bash
pnpm add zod
```

Example schema for appointment creation: title, date, time, optional strings, reminder types.

---

## 5. Documentation

**Current state:** PRD, IMPLEMENTATION_PLAN, RUNBOOK, INNGEST_TROUBLESHOOTING.

### Checklist

| Item | Priority | Notes |
|------|----------|-------|
| Setup guide | High | `docs/SETUP.md` — env, DB, local run |
| User guide | Medium | How to create appointments, tasks, reminders |
| API reference | Medium | Document `/api/v1/` endpoints |
| Runbook updates | Medium | Add troubleshooting for auth, DB, reminders |
| Architecture overview | Low | High-level diagram (optional) |

### Suggested docs

- **docs/SETUP.md** — clone, `pnpm install`, `.env.example` copy, `pnpm db:push`, `pnpm dev`
- **docs/USER_GUIDE.md** — screenshots or step-by-step for core flows
- **RUNBOOK.md** — expand "Common Issues" with more scenarios

---

## Suggested order

1. **Security** — API validation (Zod) and auth audit (foundation)
2. **Monitoring** — Sentry + logger (visibility before scaling)
3. **Accessibility** — Semantic HTML, labels, focus (impact on UX)
4. **Performance** — Lighthouse baseline, then targeted optimizations
5. **Documentation** — SETUP.md first, then user guide and runbook

---

## References

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
