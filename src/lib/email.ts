// src/lib/email.ts
import { Resend } from "resend";
import nodemailer from "nodemailer";

const provider = process.env.EMAIL_PROVIDER;
const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@example.com";
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

function inviteHtml(link: string) {
  return `
    <div style="font-family:system-ui,Segoe UI,Roboto,Arial">
      <h2>Einladung zur Zeiterfassung</h2>
      <p>Du wurdest eingeladen. Klicke auf den Link, um dein Passwort zu setzen:</p>
      <p><a href="${link}" target="_blank" rel="noopener noreferrer">${link}</a></p>
    </div>
  `;
}

export async function sendEmail(to: string, token: string) {
  const link = `${baseUrl}/invite/${token}`;

  if (provider === "resend") {
    const apiKey = process.env.RESEND_API_KEY!;
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: fromAddress,
      to,
      subject: "Einladung – Zeiterfassung",
      html: inviteHtml(link),
    });
    return;
  }

  if (provider === "smtp") {
    const port = Number(process.env.SMTP_PORT || 587);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST!,
      port,
      secure: port === 465, // 465 = TLS/SSL, 587 = STARTTLS
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    });

    await transporter.sendMail({
      // Header-From (sichtbar beim Empfänger)
      from: fromAddress,                // z.B. "Dein Name <deinname@web.de>"
      to,
      subject: "Einladung – Zeiterfassung",
      html: inviteHtml(link),

      // Envelope-From (SMTP MAIL FROM) – muss bei web.de erlaubt sein!
      envelope: {
        from: process.env.SMTP_USER!,   // **GENAU deine web.de-Adresse**
        to: [to],
      },

      // Optional:
      // replyTo: fromAddress,
    });

    return;
  }

  // Fallback – lokal nur Logging
  console.log("INVITE LINK (no provider configured):", link);
}
