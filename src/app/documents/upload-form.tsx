'use client'

import { useActionState, useEffect, useRef } from 'react'
import { uploadDocument, type UploadState } from '@/app/documents/actions'

export function UploadForm() {
  const [state, action, pending] = useActionState<UploadState, FormData>(uploadDocument, undefined)
  const formRef = useRef<HTMLFormElement>(null)

  // Clear the file input after a successful upload.
  useEffect(() => {
    if (state?.message) formRef.current?.reset()
  }, [state])

  return (
    <form
      ref={formRef}
      action={action}
      className="rounded-xl border border-dashed border-slate-300 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="file"
          name="file"
          required
          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100 dark:text-slate-400 dark:file:bg-indigo-950/50 dark:file:text-indigo-300"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
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
