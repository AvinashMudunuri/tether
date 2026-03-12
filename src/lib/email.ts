import { Resend } from "resend";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(apiKey);
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
  const { to, subject, appointmentTitle, date, time, location, appointmentUrl } = params;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e293b;">Reminder: ${appointmentTitle}</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.6;">
        Your appointment is coming up soon.
      </p>
      <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
        <tr><td style="padding: 8px 0; color: #64748b;"><strong>Date:</strong></td><td style="padding: 8px 0; color: #1e293b;">${date}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;"><strong>Time:</strong></td><td style="padding: 8px 0; color: #1e293b;">${time}</td></tr>
        ${location ? `<tr><td style="padding: 8px 0; color: #64748b;"><strong>Location:</strong></td><td style="padding: 8px 0; color: #1e293b;">${location}</td></tr>` : ""}
      </table>
      <p style="margin-top: 24px;">
        <a href="${appointmentUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">View Appointment</a>
      </p>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">
        This is an automated reminder from Tetherly.
      </p>
    </div>
  `;

  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Tetherly <onboarding@resend.dev>",
    to: [to],
    subject,
    html,
  });

  if (error) throw error;
  return data;
}
