import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

const EMAIL_OTP_TYPES: readonly string[] = [
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
]

function parseOtpType(value: string | null): EmailOtpType | null {
  return value !== null && EMAIL_OTP_TYPES.includes(value) ? (value as EmailOtpType) : null
}

/**
 * Only allow same-origin relative paths: a single leading slash, NOT "//" or "/\"
 * (which the URL parser would resolve to an absolute off-site URL — open redirect).
 */
function safeNext(value: string | null): string {
  return value && /^\/(?![/\\])/.test(value) ? value : '/'
}

/**
 * Handles the email confirmation link sent by Supabase after signup.
 * Verifies the one-time token, which sets the session cookie, then redirects.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = parseOtpType(searchParams.get('type'))
  const next = safeNext(searchParams.get('next'))

  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  return NextResponse.redirect(new URL('/login?error=confirmation-failed', request.url))
}
