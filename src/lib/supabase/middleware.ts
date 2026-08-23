import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/types/database'

const PUBLIC_PATHS = [
  '/', // public landing page (exact match only — see isPublic below)
  '/login',
  '/signup',
  '/forgot-password',
  '/auth',
  '/share',
  '/api/share',
  // PWA assets must load without auth (install + service worker).
  '/manifest.webmanifest',
  '/sw.js',
  '/icon-192',
  '/icon-512',
  '/apple-icon',
]

/**
 * Refreshes the Supabase session on every request and guards private routes.
 * Public routes (auth pages + public share links) are always allowed.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  try {
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            )
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            )
          },
        },
      },
    )

    // IMPORTANT: getUser() revalidates the token with Supabase Auth.
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl
    const isPublic = PUBLIC_PATHS.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    )

    if (!user && !isPublic) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectedFrom', pathname)
      return NextResponse.redirect(url)
    }

    return response
  } catch {
    // Never 500 the entire site if the auth refresh fails (e.g. Supabase
    // unreachable/paused). Fail open — every private page runs its own
    // getUser() + redirect('/login') guard, so nothing is left unprotected.
    return response
  }
}
