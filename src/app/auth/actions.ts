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
  if (!email || !password) return 'Email and password are required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.'
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  }
  return null
}

export async function login(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = readCredentials(formData)

  const validationError = validate(email, password)
  if (validationError) return { error: validationError }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: error.message }

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

  if (error) return { error: error.message }

  // When email confirmation is enabled, no session is returned yet.
  if (!data.session) {
    return { message: 'Check your inbox to confirm your email, then sign in.' }
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
