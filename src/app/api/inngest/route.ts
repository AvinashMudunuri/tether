import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { sendReminder, markMissedAppointments } from "@/inngest/functions";

// Fail fast in production if Inngest signing key is missing (webhook auth required)
if (
  process.env.NODE_ENV === "production" &&
  process.env.INNGEST_DEV !== "1" &&
  !process.env.INNGEST_SIGNING_KEY
) {
  throw new Error(
    "INNGEST_SIGNING_KEY is required in production for Inngest webhook verification"
  );
}

// Required for Vercel: Inngest functions can run up to 5 min
export const maxDuration = 300;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [sendReminder, markMissedAppointments],
});
