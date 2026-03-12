# Tether — Implementation Plan

## Overview

This document outlines the phased implementation plan for the Tether (Personal Appointment & Task Manager) MVP. Total estimated duration: 5–6 weeks.

---

## Phase 1: Foundation (Weeks 1–2)

### 1.1 Project Setup

- Initialize Next.js 14 project with App Router, TypeScript, ESLint
- Configure Tailwind CSS
- Set up project structure:
  ```
  src/
  ├── app/
  │   ├── (auth)/          # Login, signup routes
  │   ├── (dashboard)/     # Protected dashboard routes
  │   ├── api/             # API routes
  │   └── layout.tsx
  ├── components/
  ├── lib/
  │   ├── db.ts
  │   └── auth.ts
  └── types/
  ```

### 1.2 Database Setup

- Create PostgreSQL database (Supabase or Neon)
- Install Prisma
- Define schema from PRD data model:
  - User, Appointment, Task, ChecklistItem, Reminder
- Run migrations

### 1.3 Authentication

- Integrate Supabase Auth
- Implement email/password strategy
- Create sign-up and login pages
- Set up protected route middleware
- Session handling

### 1.4 Base Layout

- Root layout with navigation
- Auth layout (centered form)
- Dashboard layout (sidebar/header)
- Responsive shell

**Deliverables:** Working auth flow, database connection, base UI shell

---

## Phase 2: Core Data & API (Weeks 2–3)

### 2.1 Appointment API

- `POST /api/appointments` — Create
- `GET /api/appointments` — List (with date range filter)
- `GET /api/appointments/[id]` — Get by ID
- `PUT /api/appointments/[id]` — Update
- `DELETE /api/appointments/[id]` — Delete
- Validation: title, date, time required

### 2.2 Task API

- `POST /api/tasks` — Create
- `GET /api/tasks` — List
- `PUT /api/tasks/[id]` — Update (including `completed`)
- `DELETE /api/tasks/[id]` — Delete

### 2.3 Checklist API

- Separate endpoints (see PRD Section 9)
- `GET /api/checklist?appointmentId=:id` — List items for appointment
- `POST /api/checklist` — Add item (body: `appointmentId`, `label`, `order?`)
- `PUT /api/checklist/:id` — Toggle/update
- `DELETE /api/checklist/:id` — Remove

### 2.4 Dashboard API

- `GET /api/dashboard` — Returns:
  - Today's appointments
  - Upcoming appointments (next 7 days)
  - Overdue/pending tasks

### 2.5 Error Handling

- Consistent error response format: `{ error: string, code?: string }`
- Validation errors with field-level messages
- 401 for unauthenticated, 404 for not found

**Deliverables:** Full CRUD APIs, validation, dashboard endpoint

---

## Phase 3: Dashboard & Calendar (Weeks 3–4)

### 3.1 Dashboard Page

- Today's appointments section
- Upcoming events (next 7 days)
- Pending tasks summary
- Quick "New Appointment" button (prominent)

### 3.2 Appointment Form

- Modal or dedicated page
- Required: title, date, time
- Optional: location, attendees, notes
- Inline checklist (add/remove/toggle items)
- Optimize for <15 second creation:
  - Minimal fields above the fold
  - Smart defaults (today's date, next hour)
  - Keyboard shortcuts (e.g., Enter to save)

### 3.3 Calendar View

- Daily view: time slots with appointments
- Weekly view: 7-day grid
- Monthly view: traditional calendar grid
- Navigation: prev/next, today
- Click date to create appointment or view details

### 3.4 Task List

- List view with due date and completion checkbox
- Filter: all / pending / completed
- Quick add task
- Edit/delete actions

### 3.5 Mobile Responsiveness

- Responsive breakpoints (mobile, tablet, desktop)
- Touch-friendly buttons and forms
- Collapsible navigation on mobile

**Deliverables:** Full dashboard, calendar, task list, appointment form, mobile-responsive UI

---

## Phase 4: Reminders & Polish (Weeks 4–5)

### 4.1 Reminder Service

- Vercel Cron for scheduled reminder jobs
- Query appointments with reminders due (24h, 1h, or custom)
- Send email via Resend
- Mark reminder as sent
- Retry logic for failed sends (2 retries with backoff)

### 4.2 Reminder Configuration

- Per-appointment reminder settings
- Default: 24h and 1h before
- Optional: custom times (e.g., 2 days, 30 min)

### 4.3 Email Templates

- Reminder email template: subject, body with appointment details
- Optional: welcome email on sign-up

### 4.4 Accessibility Pass

- ARIA labels on interactive elements
- Keyboard navigation (Tab, Enter, Escape)
- Focus management in modals
- Color contrast check (WCAG AA)

### 4.5 Monitoring & Errors

- Integrate Sentry or similar for error tracking
- Health check endpoint: `GET /api/health`
- Basic logging for API errors

**Deliverables:** Working email reminders, accessibility improvements, monitoring

---

## Phase 5: Testing & Launch (Weeks 5–6)

### 5.1 Testing

- E2E tests (Playwright or Cypress):
  - Sign up → Login → Create appointment → View dashboard
  - Create task → Mark complete
  - Calendar navigation
- Critical path coverage

### 5.2 Security Review

- Auth flow review
- SQL injection / XSS checks
- Environment variables for secrets

### 5.3 Performance

- Lighthouse audit
- Optimize slow queries
- Ensure page load < 3s

### 5.4 Deployment

- Deploy to Vercel
- Configure environment variables
- Set up production database
- Configure cron for reminders

### 5.5 Documentation

- README with setup instructions
- Environment variables list
- Basic runbook for common issues

**Deliverables:** Deployed app, E2E tests, documentation

---

## Milestone Summary

| Phase | Duration | Key Milestone |
|-------|----------|---------------|
| 1 | Weeks 1–2 | Auth + DB + base layout |
| 2 | Weeks 2–3 | Full CRUD APIs |
| 3 | Weeks 3–4 | Dashboard, calendar, forms |
| 4 | Weeks 4–5 | Reminders, accessibility, monitoring |
| 5 | Weeks 5–6 | Testing, deployment, launch |

---

## Dependencies

- Node.js 18+
- PostgreSQL database
- Resend account (for email)
- Vercel account (for hosting)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Email deliverability | Use Resend; verify domain |
| Cron reliability | Use Vercel Cron; consider fallback polling |
| Database scaling | Start with managed Postgres; plan for connection pooling if needed |
