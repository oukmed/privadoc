'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: translateAuthError(error.message) }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = readCredentials(formData)

  const validationError = validate(email, password)
  if (validationError) return { error: validationError }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
    },
  })

  if (error) return { error: translateAuthError(error.message) }

  // When email confirmation is enabled, no session is returned yet.
  if (!data.session) {
    return { message: 'Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
