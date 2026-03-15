# Inngest Reminders — Troubleshooting

If appointment reminders are not being sent, work through this checklist.

## Two Ways Reminders Are Sent

1. **Scheduled events** — When you create an appointment, we send `reminder/send` events to Inngest with a `ts` (timestamp). Inngest should run the function at that time.
2. **Cron fallback** — A cron runs every 5 minutes and processes any due reminders. This works even if scheduled events don't trigger. After deploying, reminders should arrive within 5 minutes of their due time.

## 1. Vercel Environment Variables

In **Vercel → Project → Settings → Environment Variables**, ensure:

| Variable | Required | Notes |
|----------|----------|-------|
| `INNGEST_EVENT_KEY` | Yes | From [Inngest Dashboard](https://app.inngest.com) → Manage → Event Keys |
| `INNGEST_SIGNING_KEY` | Yes | From Inngest Dashboard → Manage → Signing Keys |
| `INNGEST_DEV` | Recommended | Set to `0` for **Production** to force Cloud mode (not localhost) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Needed to fetch user email for reminders |
| `RESEND_API_KEY` | Yes | Needed to send reminder emails |
| `NEXT_PUBLIC_APP_URL` | Yes | Your Vercel URL, e.g. `https://tetherly-xxx.vercel.app` |

**Important:** Add `INNGEST_DEV=0` for Production. Without it, events may route to localhost instead of Inngest Cloud.

## 2. Vercel Deployment Protection

If **Deployment Protection** is enabled on your Vercel project, Inngest might not be able to reach your app.

**Options:**
- Disable Deployment Protection for your project, or
- **Pro plan:** Use [Protection Bypass for Automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation) and configure Inngest’s bypass in [Inngest Vercel integration settings](https://app.inngest.com/settings/integrations/vercel).

## 3. Inngest Vercel Integration

Use the [Inngest Vercel integration](https://app.inngest.com/settings/integrations/vercel/connect):

1. Auto-syncs your app on every deploy
2. Sets `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` automatically
3. Reduces manual sync issues

## 4. App ID

The Inngest client uses `id: "tetherly"`. If you previously had an app synced as `tether`, you may see two apps. Either delete the old one in Inngest Dashboard or change the client ID in `src/inngest/client.ts` to match your existing app.

## 5. App Sync Status

In [Inngest Dashboard](https://app.inngest.com) → Apps:

- Confirm your app is listed and synced
- If it shows as **Not synced** or fails, Inngest cannot reach your app.

**Common causes:**
- Deployment Protection blocking the sync endpoint
- Wrong or missing `INNGEST_SIGNING_KEY`
- App URL not reachable (e.g. firewall, custom domain)

## 6. Function Runs

In Inngest Dashboard → **Runs**:

- Check if `reminder/send` events are received
- Check if the `send-appointment-reminder` function runs
- Inspect failed runs for error details

## 7. Vercel Logs

After creating an appointment:

- Go to **Vercel → Project → Logs** (or Deployments → Logs)
- Look for `[schedule-reminders] inngest.send failed` — indicates an error sending events to Inngest
- Look for Inngest API errors (e.g. `NO_EVENT_KEY_SET`)

## 8. User Preferences

Reminders are skipped if the user has disabled them:

- In **Profile → Notification settings**, check “Email reminders”
- If disabled, reminders are not sent (by design)

## 9. Quick Test

1. Create a new appointment for **15 minutes from now**
2. Choose the 15‑minute reminder option
3. Check Inngest Dashboard → Runs for a `reminder/send` event
4. Wait 15 minutes and check your email

## Summary Checklist

- [ ] `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` set in Vercel
- [ ] `INNGEST_DEV=0` set for Production
- [ ] Deployment Protection disabled or bypass configured
- [ ] Inngest Vercel integration installed (recommended)
- [ ] App shows as synced in Inngest Dashboard
- [ ] `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` set
- [ ] User has not disabled email reminders in profile
