# Security Audit Fixes Applied

Addresses findings from the security-audit agent. See `docs/FOCUS_AREAS.md` for the full plan.

## Critical (fixed)

### 1. File upload: path traversal via filename extension
**File:** `src/lib/storage.ts`

- Extension is now derived only from the validated MIME type (whitelist: jpg, jpeg, png, webp), never from `file.name`.
- `buildStoragePath()` uses `getSafeExtension(mimeType)` instead of `file.name.split(".").pop()`.

### 2. File upload: MIME type from client only
**File:** `src/lib/storage.ts`

- Added `validateFileMagicBytes(buffer, declaredMime)` that checks actual file content via magic bytes:
  - JPEG: `FF D8 FF`
  - PNG: `89 50 4E 47 0D 0A 1A 0A`
  - WebP: `RIFF` + `WEBP` at bytes 8–11
- Validation runs in `uploadToStorage()` before upload; rejects mismatched content.

### 3. Inngest signing key in production
**File:** `src/app/api/inngest/route.ts`

- Module-level check throws if `NODE_ENV === "production"` and `INNGEST_DEV !== "1"` and `INNGEST_SIGNING_KEY` is missing.
- Ensures webhook requests cannot be forged in production.

## High (fixed)

### 4. Email HTML: unescaped user data (XSS)
**File:** `src/lib/email.ts`

- Added `escapeHtml()` for text content and `escapeUrl()` for links.
- All user-controlled values (`appointmentTitle`, `date`, `time`, `location`, `appointmentUrl`) are escaped before insertion into HTML.

### 5. Supabase env non-null assertions
**Files:** `src/lib/supabase/server.ts`, `client.ts`, `middleware.ts`

- Created `src/lib/env.ts` with `getSupabaseUrl()` and `getSupabaseAnonKey()` that throw on missing values.
- Replaced all `process.env.NEXT_PUBLIC_SUPABASE_*!` usages with these getters.

### 6. No rate limiting on auth and sensitive endpoints
**Files:** `src/lib/rate-limit.ts`, `src/lib/supabase/middleware.ts`

- Added Upstash Redis rate limiting (optional; needs `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`):
  - Auth routes (login, signup, forgot-password): 5 requests per 15 min per IP
  - API routes (`/api/v1/*`): 100 requests per min per IP
- Excluded: `/api/inngest`, `/api/cron`, `/api/health`
- Uses `@upstash/redis/cloudflare` for Edge Runtime compatibility in middleware.

## Medium (fixed)

### 7–9. fileName sanitization
**File:** `src/lib/storage.ts`

- Added `sanitizeFileName(name)` that:
  - Keeps only basename (drops path components)
  - Replaces unsafe characters with `_`
  - Caps length at 255 chars
- Attachment routes store `sanitizedFileName` instead of raw `file.name`.

### 10. Hardcoded fallback URL in forgot-password
**File:** `src/app/(auth)/forgot-password/page.tsx`

- Removed hardcoded `"https://www.tetherly.site"`.
- Uses `getAppUrl()` from `@/lib/env` when `window` is undefined (SSR fallback).

## Deferred

- **#7 (Zod for API bodies):** Not implemented in this pass; tracked in `docs/FOCUS_AREAS.md`.
- **#8 (Date query params validation):** To be added with Zod when API schemas are introduced.
- **#11 (Firebase service account path):** Low risk; can be hardened later.

## New env vars

| Variable | Required | Description |
|----------|----------|-------------|
| `INNGEST_SIGNING_KEY` | Yes (production) | Inngest webhook verification |
| `UPSTASH_REDIS_REST_URL` | No | Rate limiting (optional) |
| `UPSTASH_REDIS_REST_TOKEN` | No | Rate limiting (optional) |

## Verification

```bash
pnpm run build   # Should complete successfully
pnpm run lint    # No new issues
```
