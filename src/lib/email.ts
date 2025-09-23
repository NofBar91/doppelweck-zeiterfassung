// src/lib/email.ts
import { Resend } from "resend";
import nodemailer from "nodemailer";

const provider = process.env.EMAIL_PROVIDER;
const from = process.env.EMAIL_FROM || "Zeiterfassung <noreply@example.com>";
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

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

// === Speziell für Einladungen (2 Argumente: Empfänger + Token) ===
export async function sendEmail(to: string, token: string) {
  const link = `${baseUrl}/invite/${token}`;
  return sendMail({
    to,
    subject: "Einladung – Zeiterfassung",
    html: inviteHtml(link),
  });
}

// === Generischer Mail-Sender (1 Objekt-Argument) ===
export async function sendMail(opts: { to: string; subject: string; html: string }) {
  if (provider === "resend") {
    const apiKey = process.env.RESEND_API_KEY!;
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    return;
  }

  if (provider === "smtp") {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST!,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465, // SSL nur bei 465
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    });
    await transporter.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    return;
  }

  // Fallback: kein Provider → Link/HTML nur in Konsole ausgeben
  console.log("EMAIL FALLBACK:", opts);
}
