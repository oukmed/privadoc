'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ''

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

export async function signup(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = readCredentials(formData)

  const validationError = validate(email, password)
  if (validationError) return { error: validationError }

  // Create the account already confirmed (server-side, admin) so signup never
  // depends on Supabase's confirmation email / SMTP, then sign in immediately.
  const { error: createError } = await createAdminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (createError) return { error: translateAuthError(createError.message) }

  const supabase = await createClient()
  const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) return { error: translateAuthError(signInError.message) }

  const explicit = safeNext(formData.get('next'))
  const target = explicit !== '/' ? explicit : await defaultLanding(supabase, data.user?.id)

  revalidatePath('/', 'layout')
  redirect(target)
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
  return { message: 'Si un compte existe pour cet email, un lien de réinitialisation vient d’être envoyé.' }
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
