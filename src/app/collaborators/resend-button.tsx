'use client'

import { useActionState } from 'react'
import { resendInvite } from '@/app/collaborators/actions'

export function ResendButton({ collaboratorId }: { collaboratorId: string }) {
  const [state, action, pending] = useActionState(resendInvite, undefined)

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="collaboratorId" value={collaboratorId} />
      <button
        type="submit"
        disabled={pending}
        className="text-sm font-medium text-indigo-600 transition hover:text-indigo-500 disabled:opacity-50 dark:text-indigo-400"
      >
        {pending ? 'Envoi…' : 'Relancer'}
      </button>
      {state?.message && (
        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Envoyée ✓</span>
      )}
      {state?.error && (
        <span className="text-xs font-medium text-red-600 dark:text-red-400">Échec</span>
      )}
    </form>
  )
}
