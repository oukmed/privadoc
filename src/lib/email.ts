import 'server-only'
import nodemailer from 'nodemailer'

/** Escape user-controlled values before interpolating them into email HTML. */
export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  )
}

interface SendEmailArgs {
  to: string
  subject: string
  html: string
}

/**
 * Sends a transactional email via Gmail SMTP. SERVER-ONLY.
 * Requires GMAIL_USER (the address) and GMAIL_APP_PASSWORD (a 16-char Google
 * App Password, NOT the account password). Returns { error } with a French
 * message on failure, or {} on success.
 */
export async function sendEmail(args: SendEmailArgs): Promise<{ error?: string }> {
  const user = process.env.GMAIL_USER
  // App passwords are shown with spaces in the Google UI; SMTP wants them stripped.
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '')

  if (!user || !pass) {
    return { error: "Envoi d'email non configuré (GMAIL_USER / GMAIL_APP_PASSWORD manquant)." }
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })

  try {
    // A plain-text alternative lowers spam scoring for otherwise HTML-only mail.
    const text = args.html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    await transporter.sendMail({
      from: `PrivaDoc <${user}>`,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text,
    })
    return {}
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "Échec de l'envoi de l'email." }
  }
}
