import twilio from "twilio";

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    throw new Error("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required for SMS");
  }
  return twilio(accountSid, authToken);
}

/**
 * Normalize phone to E.164.
 * Accepts: +919876543210, 919876543210, 9876543210 (assumes India +91)
 */
function toE164(phone: string): string {
  let normalized = phone.replace(/\D/g, "");
  if (!normalized.startsWith("91") && normalized.length === 10) {
    normalized = "91" + normalized;
  }
  return `+${normalized}`;
}

export async function sendReminderSms(params: {
  to: string;
  appointmentTitle: string;
  date: string;
  time: string;
  location?: string;
  appointmentUrl: string;
}): Promise<void> {
  const { to, appointmentTitle, date, time, location, appointmentUrl } = params;

  let body = `Reminder: ${appointmentTitle}\n\n`;
  body += `Your appointment is coming up soon.\n`;
  body += `Date: ${date}\n`;
  body += `Time: ${time}\n`;
  if (location) {
    body += `Location: ${location}\n`;
  }
  body += `\nView details: ${appointmentUrl}\n\n`;
  body += `— Tetherly`;

  const client = getTwilioClient();
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!fromNumber) {
    throw new Error("TWILIO_PHONE_NUMBER is required for SMS (your Twilio phone number)");
  }

  await client.messages.create({
    body,
    from: fromNumber,
    to: toE164(to),
  });
}
