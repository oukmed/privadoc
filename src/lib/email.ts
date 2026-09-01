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

// Sender identity on our OWN authenticated domain (privadoc.app) — this is what
// keeps mail out of spam once SPF/DKIM/DMARC are set for the domain in Resend.
const EMAIL_FROM = process.env.EMAIL_FROM ?? 'PrivaDoc <no-reply@privadoc.app>'
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO

/** A plain-text alternative lowers spam scoring for otherwise HTML-only mail. */
function htmlToText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Transactional email delivery. SERVER-ONLY. Returns { error } with a French
 * message on failure, or {} on success.
 *
 * Prefers Resend (a real transactional provider on our authenticated domain) when
 * RESEND_API_KEY is set — the deliverable path. Falls back to Gmail SMTP otherwise,
 * so email keeps working during the migration until the domain's DNS is verified.
 */
export async function sendEmail(args: SendEmailArgs): Promise<{ error?: string }> {
  const text = htmlToText(args.html)
  const resendKey = process.env.RESEND_API_KEY
  return resendKey ? sendViaResend(resendKey, args, text) : sendViaGmail(args, text)
}

async function sendViaResend(
  apiKey: string,
  args: SendEmailArgs,
  text: string,
): Promise<{ error?: string }> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: args.to,
        subject: args.subject,
        html: args.html,
        text,
        ...(EMAIL_REPLY_TO ? { reply_to: EMAIL_REPLY_TO } : {}),
      }),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      return { error: `Envoi d'email refusé (Resend ${res.status}). ${detail.slice(0, 200)}` }
    }
    return {}
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "Échec de l'envoi de l'email." }
  }
}

/**
 * Legacy fallback. Requires GMAIL_USER (the address) and GMAIL_APP_PASSWORD (a
 * 16-char Google App Password, NOT the account password).
 */
async function sendViaGmail(args: SendEmailArgs, text: string): Promise<{ error?: string }> {
  const user = process.env.GMAIL_USER
  // App passwords are shown with spaces in the Google UI; SMTP wants them stripped.
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '')

  if (!user || !pass) {
    return { error: "Envoi d'email non configuré (RESEND_API_KEY ou GMAIL_USER/GMAIL_APP_PASSWORD)." }
  }

  const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } })

  try {
    await transporter.sendMail({
      from: `PrivaDoc <${user}>`,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text,
      ...(EMAIL_REPLY_TO ? { replyTo: EMAIL_REPLY_TO } : {}),
    })
    return {}
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "Échec de l'envoi de l'email." }
  }
}
