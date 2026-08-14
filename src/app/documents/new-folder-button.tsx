'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { createFolder, type FolderState } from '@/app/folders/actions'

interface NewFolderButtonProps {
  /** Parent folder for the new folder; empty at the root. */
  parentId?: string
}

export function NewFolderButton({ parentId }: NewFolderButtonProps) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState<FolderState, FormData>(createFolder, undefined)
  const [seenState, setSeenState] = useState(state)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus the field when the dialog opens.
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Close automatically once a folder is created (adjust state during render —
  // each dispatch returns a new state reference, so this fires once per result).
  if (state !== seenState) {
    setSeenState(state)
    if (state?.message) setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4">
          <path
            d="M3 6a2 2 0 0 1 2-2h3l2 2h5a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M10 9v4M8 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Nouveau dossier
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Nouveau dossier"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900"
          >
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Nouveau dossier
            </h2>
            <form action={action} className="mt-4">
              {parentId && <input type="hidden" name="parentId" value={parentId} />}
              <label htmlFor="folder-name" className="sr-only">
                Nom du dossier
              </label>
              <input
                id="folder-name"
                ref={inputRef}
                name="name"
                required
                maxLength={100}
                placeholder="Nom du dossier"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              {state?.error && (
                <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {state.error}
                </p>
              )}
              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? 'Création…' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
