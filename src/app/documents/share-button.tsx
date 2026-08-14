'use client'

import { useActionState, useState } from 'react'
import { createShare, type ShareState } from '@/app/documents/share-actions'

interface ShareButtonProps {
  documentId: string
}

export function ShareButton({ documentId }: ShareButtonProps) {
  const [state, action, pending] = useActionState<ShareState, FormData>(createShare, undefined)
  const [copied, setCopied] = useState(false)

  async function copy(url: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {state?.url ? (
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={state.url}
            onFocus={(e) => e.currentTarget.select()}
            className="w-40 rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-xs text-slate-700 sm:w-56 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
          <button
            type="button"
            onClick={() => copy(state.url ?? '')}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            {copied ? 'Lien copié' : 'Copier'}
          </button>
        </div>
      ) : (
        <form action={action} className="flex items-center gap-2">
          <input type="hidden" name="documentId" value={documentId} />
          <select
            name="expiresInDays"
            defaultValue="7"
            aria-label="Expiration du lien"
            className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="1">1 jour</option>
            <option value="7">7 jours</option>
            <option value="30">30 jours</option>
            <option value="0">Jamais</option>
          </select>
          <button
            type="submit"
            disabled={pending}
            className="text-sm font-medium text-indigo-600 transition hover:text-indigo-500 disabled:opacity-60 dark:text-indigo-400"
          >
            {pending ? 'Création…' : 'Partager'}
          </button>
        </form>
      )}
      {state?.error && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </div>
  )
}
