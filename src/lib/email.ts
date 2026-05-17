import { Resend } from "resend";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(apiKey);
}

/** Escape user-controlled data for safe use in HTML (XSS prevention). */
function escapeHtml(str: string): string {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Escape for use in href to prevent javascript: and data: URIs. */
function escapeUrl(str: string): string {
  const trimmed = str.trim();
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:")
  ) {
    return "#";
  }
  return escapeHtml(trimmed);
}

export async function sendReminderEmail(params: {
  to: string;
  subject: string;
  appointmentTitle: string;
  date: string;
  time: string;
  location?: string;
  appointmentUrl: string;
}) {
  const {
    to,
    subject,
    appointmentTitle,
    date,
    time,
    location,
    appointmentUrl,
  } = params;

  const safeTitle = escapeHtml(appointmentTitle);
  const safeDate = escapeHtml(date);
  const safeTime = escapeHtml(time);
  const safeLocation = location ? escapeHtml(location) : "";
  const safeUrl = escapeUrl(appointmentUrl);

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e293b;">Reminder: ${safeTitle}</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.6;">
        Your appointment is coming up soon.
      </p>
      <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
        <tr><td style="padding: 8px 0; color: #64748b;"><strong>Date:</strong></td><td style="padding: 8px 0; color: #1e293b;">${safeDate}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;"><strong>Time:</strong></td><td style="padding: 8px 0; color: #1e293b;">${safeTime}</td></tr>
        ${safeLocation ? `<tr><td style="padding: 8px 0; color: #64748b;"><strong>Location:</strong></td><td style="padding: 8px 0; color: #1e293b;">${safeLocation}</td></tr>` : ""}
      </table>
      <p style="margin-top: 24px;">
        <a href="${safeUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">View Appointment</a>
      </p>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">
        This is an automated reminder from Tetherly.
      </p>
    </div>
  `;

  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Tetherly <reminders@tetherly.site>",
    to: [to],
    subject,
    html,
  });

  if (error) throw error;
  return data;
}
