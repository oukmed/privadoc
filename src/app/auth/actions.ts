'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ''

// Best-effort in-memory throttle for password-reset emails. Serverless: per warm
// instance, resets on cold start — enough to blunt rapid inbox spam.
// ponytail: move to a shared store (DB/Redis) only if abuse actually appears.
const resetHits = new Map<string, number[]>()
function resetThrottled(email: string): boolean {
  const now = Date.now()
  const windowMs = 15 * 60 * 1000
  const recent = (resetHits.get(email) ?? []).filter((t) => now - t < windowMs)
  recent.push(now)
  resetHits.set(email, recent)
  return recent.length > 3
}

/**
 * Result returned by the auth Server Actions to drive `useActionState`.
 * On success the action redirects and never returns a value.
 */
export type AuthState =
  | {
      error?: string
      message?: string
    }
  | undefined

const MIN_PASSWORD_LENGTH = 8

function readCredentials(formData: FormData): { email: string; password: string } {
  return {
    email: String(formData.get('email') ?? '').trim(),
    password: String(formData.get('password') ?? ''),
  }
}

/** Same-origin relative path only (guards against open redirect); defaults to '/'. */
function safeNext(value: FormDataEntryValue | null): string {
  const v = typeof value === 'string' ? value : ''
  return /^\/(?![/\\])/.test(v) ? v : '/'
}

/**
 * Where to send a user with no explicit `next`: a client who still has open
 * document requests lands on "Mes demandes" so they act on them right away.
 */
async function defaultLanding(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string | undefined,
): Promise<string> {
  if (!userId) return '/'
  const { count } = await supabase
    .from('document_requests')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', userId)
    .eq('status', 'open')
  return (count ?? 0) > 0 ? '/requests' : '/'
}

function validate(email: string, password: string): string | null {
  if (!email || !password) return 'Email et mot de passe requis.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Adresse email invalide.'
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`
  }
  return null
}

/** Map common Supabase auth errors (English) to French user-facing messages. */
function translateAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Email ou mot de passe incorrect.'
  if (m.includes('email not confirmed')) return 'Adresse email non confirmée. Vérifie ta boîte mail.'
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'Un compte existe déjà avec cet email.'
  }
  if (m.includes('rate limit')) return 'Trop de tentatives. Réessaie dans quelques minutes.'
  if (m.includes('password')) return 'Mot de passe invalide (au moins 8 caractères).'
  return 'Une erreur est survenue. Réessaie.'
}

export async function login(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = readCredentials(formData)

  const validationError = validate(email, password)
  if (validationError) return { error: validationError }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: translateAuthError(error.message) }

  const explicit = safeNext(formData.get('next'))
  const target = explicit !== '/' ? explicit : await defaultLanding(supabase, data.user?.id)

  revalidatePath('/', 'layout')
  redirect(target)
}

function confirmEmailHtml(url: string): string {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;color:#1e293b">
      <h2 style="color:#4f46e5">Confirme ton adresse email</h2>
      <p>Bienvenue sur PrivaDoc ! Clique sur le bouton ci-dessous pour activer ton compte :</p>
      <p><a href="${url}" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Confirmer mon adresse</a></p>
      <p style="color:#64748b;font-size:13px">Si tu n'es pas à l'origine de cette inscription, ignore cet email.</p>
    </div>`
}

/**
 * Creates the account UNCONFIRMED and emails a confirmation link via our own
 * Gmail mailer (Supabase has no SMTP). The user must click the link before they
 * can sign in — `signInWithPassword` returns "Email not confirmed" otherwise.
 */
export async function signup(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = readCredentials(formData)

  const validationError = validate(email, password)
  if (validationError) return { error: validationError }

  // generateLink({type:'signup'}) creates the unconfirmed user AND returns the
  // confirmation token — we deliver it ourselves.
  const { data, error } = await createAdminClient().auth.admin.generateLink({
    type: 'signup',
    email,
    password,
  })
  if (error) return { error: translateAuthError(error.message) }

  const hashedToken = data?.properties?.hashed_token
  if (!hashedToken) return { error: 'Impossible de créer le compte. Réessaie.' }

  // Store the name so it shows everywhere (shares, invites, requests). The
  // signup trigger already created the profile row; upsert is defensive.
  const displayName = String(formData.get('displayName') ?? '').trim().slice(0, 120)
  if (displayName && data.user?.id) {
    await createAdminClient()
      .from('profiles')
      .upsert({ id: data.user.id, display_name: displayName })
  }

  const next = safeNext(formData.get('next'))
  const url = `${APP_URL}/auth/confirm?token_hash=${hashedToken}&type=signup&next=${encodeURIComponent(next)}`
  const { error: emailError } = await sendEmail({
    to: email,
    subject: 'Confirme ton adresse email — PrivaDoc',
    html: confirmEmailHtml(url),
  })
  if (emailError) {
    return { error: `Compte créé mais l’email de confirmation n’a pas pu être envoyé : ${emailError}` }
  }

  return {
    message: 'Compte créé ! Vérifie ta boîte mail et clique sur le lien pour confirmer ton adresse.',
  }
}

function resetEmailHtml(url: string): string {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;color:#1e293b">
      <h2 style="color:#4f46e5">Réinitialisation du mot de passe</h2>
      <p>Vous avez demandé à réinitialiser votre mot de passe PrivaDoc. Ce lien est valable un court instant :</p>
      <p><a href="${url}" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Choisir un nouveau mot de passe</a></p>
      <p style="color:#64748b;font-size:13px">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    </div>`
}

/**
 * Sends a password-recovery link via our own Gmail mailer (Supabase has no SMTP).
 * The response is intentionally generic so it never reveals whether an account
 * exists for the given email.
 */
export async function requestPasswordReset(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Adresse email invalide.' }

  const genericMessage =
    'Si un compte existe pour cet email, un lien de réinitialisation vient d’être envoyé.'
  // Throttle before sending — return the SAME generic message so throttling never
  // reveals whether the account exists.
  if (resetThrottled(email.toLowerCase())) return { message: genericMessage }

  const { data } = await createAdminClient().auth.admin.generateLink({ type: 'recovery', email })
  const hashedToken = data?.properties?.hashed_token
  if (hashedToken) {
    const url = `${APP_URL}/auth/confirm?token_hash=${hashedToken}&type=recovery&next=/reset-password`
    await sendEmail({
      to: email,
      subject: 'Réinitialisation de votre mot de passe — PrivaDoc',
      html: resetEmailHtml(url),
    })
  }
  return { message: genericMessage }
}

/** Sets a new password for the user in the (recovery) session. */
export async function updatePassword(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirmPassword') ?? '')
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.` }
  }
  if (password !== confirm) return { error: 'Les mots de passe ne correspondent pas.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Lien expiré ou invalide. Redemande une réinitialisation.' }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: translateAuthError(error.message) }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
