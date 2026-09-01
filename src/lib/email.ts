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
// keeps mail out of spam once SPF/DKIM/DMARC are set for the domain at the provider.
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
 * Provider is chosen by whichever env is set, in order:
 *   1. RESEND_API_KEY            → Resend REST API
 *   2. SMTP_HOST (+ SMTP_USER/PASS) → any SMTP provider (Brevo, Mailjet, …)
 *   3. GMAIL_USER (+ APP_PASSWORD)  → Gmail SMTP (legacy fallback)
 * All send from EMAIL_FROM on the authenticated domain (except the Gmail path,
 * which must send from the Gmail address itself).
 */
export async function sendEmail(args: SendEmailArgs): Promise<{ error?: string }> {
  const text = htmlToText(args.html)
  if (process.env.RESEND_API_KEY) return sendViaResend(process.env.RESEND_API_KEY, args, text)
  return sendViaSmtp(args, text)
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
 * SMTP delivery via any provider. Set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS for
 * Brevo, Mailjet, etc. (sends from EMAIL_FROM on your authenticated domain). With
 * no SMTP_HOST it falls back to Gmail (GMAIL_USER/GMAIL_APP_PASSWORD, from the
 * Gmail address). App passwords are shown with spaces in Google's UI; strip them.
 */
async function sendViaSmtp(args: SendEmailArgs, text: string): Promise<{ error?: string }> {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER ?? process.env.GMAIL_USER
  const pass = (process.env.SMTP_PASS ?? process.env.GMAIL_APP_PASSWORD)?.replace(/\s/g, '')

  if (!user || !pass) {
    return {
      error:
        "Envoi d'email non configuré (RESEND_API_KEY, ou SMTP_HOST/SMTP_USER/SMTP_PASS, ou GMAIL_USER/GMAIL_APP_PASSWORD).",
    }
  }

  const port = Number(process.env.SMTP_PORT ?? 587)
  const transporter = host
    ? nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
    : nodemailer.createTransport({ service: 'gmail', auth: { user, pass } })

  try {
    await transporter.sendMail({
      // Custom SMTP sends from our authenticated domain; Gmail must send from itself.
      from: host ? EMAIL_FROM : `PrivaDoc <${user}>`,
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
