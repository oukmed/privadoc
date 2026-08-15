'use client'

import { useActionState, useEffect, useRef } from 'react'
import { replaceSharedDocument, type ShareState } from '@/app/documents/share-actions'

interface ReplaceFormProps {
  token: string
  documentId: string
}

export function ReplaceForm({ token, documentId }: ReplaceFormProps) {
  const [state, action, pending] = useActionState<ShareState, FormData>(
    replaceSharedDocument,
    undefined,
  )
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.message) formRef.current?.reset()
  }, [state])

  return (
    <form
      ref={formRef}
      action={action}
      className="mt-6 rounded-lg border border-dashed border-slate-300 p-4 dark:border-slate-700"
    >
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="documentId" value={documentId} />
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Téléverser une nouvelle version
      </p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="file"
          name="file"
          required
          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100 dark:text-slate-400 dark:file:bg-indigo-950/50 dark:file:text-indigo-300"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending && (
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-4 animate-spin">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
          {pending ? 'Téléversement…' : 'Téléverser'}
        </button>
      </div>

      {state?.error && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
      {state?.message && (
        <p role="status" className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">
          {state.message}
        </p>
      )}
    </form>
  )
}
