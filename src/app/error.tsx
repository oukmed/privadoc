'use client'

import { useEffect, useState } from 'react'

// App-wide error boundary. In production the most common error that reaches here
// is a stale tab hitting a freshly redeployed server (e.g. Next's "Failed to find
// Server Action"). Instead of showing that raw message, reload once to resync the
// tab with the live deployment. A timestamp guard prevents a reload loop when the
// error is genuinely persistent — then we show a friendly fallback.
export default function AppError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [reloading, setReloading] = useState(false)

  useEffect(() => {
    const KEY = 'pd:error-reload-at'
    let lastAt = 0
    try {
      lastAt = Number(sessionStorage.getItem(KEY) ?? 0)
    } catch {}
    if (Date.now() - lastAt > 10_000) {
      try {
        sessionStorage.setItem(KEY, String(Date.now()))
      } catch {}
      setReloading(true)
      window.location.reload()
    }
  }, [])

  // While the silent reload is in flight, render nothing (no flash of error UI).
  if (reloading) return null

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Une erreur est survenue. Réessaie, ou recharge la page.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
      >
        Réessayer
      </button>
    </div>
  )
}
