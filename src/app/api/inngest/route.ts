import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { sendReminder, markMissedAppointments } from "@/inngest/functions";

// Required for Vercel: Inngest functions can run up to 5 min
export const maxDuration = 300;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [sendReminder, markMissedAppointments],
});
