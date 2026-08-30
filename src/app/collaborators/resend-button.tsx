'use client'

import { useActionState } from 'react'
import type { CollaboratorState } from '@/app/collaborators/actions'
import { useT } from '@/lib/i18n/client'

type CollabAction = (prev: CollaboratorState, formData: FormData) => Promise<CollaboratorState>

/**
 * Submit button for a per-collaborator server action, with inline feedback
 * (pending → ✓ / Échec). Errors are shown on hover so a silent failure
 * (e.g. an RLS-blocked delete) becomes visible.
 */
export function CollabActionButton({
  action,
  collaboratorId,
  label,
  tone,
}: {
  action: CollabAction
  collaboratorId: string
  label: string
  tone: 'indigo' | 'red'
}) {
  const t = useT()
  const [state, formAction, pending] = useActionState(action, undefined)
  const color =
    tone === 'red'
      ? 'text-red-600 hover:text-red-500 dark:text-red-400'
      : 'text-indigo-600 hover:text-indigo-500 dark:text-indigo-400'

  return (
    <form action={formAction} className="flex items-center gap-1.5">
      <input type="hidden" name="collaboratorId" value={collaboratorId} />
      <button
        type="submit"
        disabled={pending}
        className={`text-sm font-medium transition disabled:opacity-50 ${color}`}
      >
        {pending ? '…' : label}
      </button>
      {state?.message && (
        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">✓</span>
      )}
      {state?.error && (
        <span
          title={state.error}
          className="text-xs font-medium text-red-600 dark:text-red-400"
        >
          {t('inbox.collab.failure')}
        </span>
      )}
    </form>
  )
}
