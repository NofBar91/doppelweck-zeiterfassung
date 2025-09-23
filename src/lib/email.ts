// src/lib/email.ts
import { Resend } from "resend";
import nodemailer from "nodemailer";

const provider = process.env.EMAIL_PROVIDER;

const from = process.env.EMAIL_FROM || "Thorsten Sehmer <thorstenstoffel@web.de>";
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://doppelweck-zeiterfassung.vercel.app";

function inviteHtml(link: string) {
  return `
    <div style="font-family:system-ui,Segoe UI,Roboto,Arial">
      <h2>Einladung zur Zeiterfassung</h2>
      <p>Du wurdest eingeladen. Klicke auf den Link, um dein Passwort zu setzen und den Zugang zu aktivieren:</p>
      <p><a href="${link}" target="_blank">${link}</a></p>
      <p>Falls du die Einladung nicht erwartest, kannst du diese E-Mail ignorieren.</p>
    </div>
  `;
}

export async function sendInviteEmail(to: string, token: string) {
  const link = `${baseUrl}/invite/${token}`;

  if (provider === "resend") {
    const apiKey = process.env.RESEND_API_KEY!;
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to,
      subject: "Einladung – Zeiterfassung",
      html: inviteHtml(link),
    });
    return;
  }

  if (provider === "smtp") {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST!,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    });
    await transporter.sendMail({
      from,
      to,
      subject: "Einladung – Zeiterfassung",
      html: inviteHtml(link),
    });
    return;
  }

  // Fallback: lokal in die Konsole (bricht Deploy nicht)
  // eslint-disable-next-line no-console
  console.log("INVITE LINK (no provider configured):", link);
}
