import twilio from "twilio";

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    throw new Error("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required for WhatsApp");
  }
  return twilio(accountSid, authToken);
}

/**
 * Normalize phone to E.164 with whatsapp: prefix.
 * Accepts: +919876543210, 919876543210, 9876543210 (assumes India +91)
 */
function toWhatsAppNumber(phone: string): string {
  let normalized = phone.replace(/\D/g, "");
  if (!normalized.startsWith("91") && normalized.length === 10) {
    normalized = "91" + normalized; // assume India if 10 digits
  }
  return `whatsapp:+${normalized}`;
}

export async function sendReminderWhatsApp(params: {
  to: string;
  appointmentTitle: string;
  date: string;
  time: string;
  location?: string;
  appointmentUrl: string;
}): Promise<void> {
  const { to, appointmentTitle, date, time, location, appointmentUrl } = params;

  let body = `🔔 *Reminder: ${appointmentTitle}*\n\n`;
  body += `Your appointment is coming up soon.\n\n`;
  body += `📅 Date: ${date}\n`;
  body += `🕐 Time: ${time}\n`;
  if (location) {
    body += `📍 Location: ${location}\n`;
  }
  body += `\nView details: ${appointmentUrl}\n\n`;
  body += `— Tetherly`;

  const client = getTwilioClient();
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

  await client.messages.create({
    body,
    from: fromNumber,
    to: toWhatsAppNumber(to),
  });
}
