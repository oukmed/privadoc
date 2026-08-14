import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// `middleware` was renamed to `proxy` in Next.js 16. This file must live at the
// same level as `app` — i.e. inside `src/` — to be picked up.
export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and image optimization.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
