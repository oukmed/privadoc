'use client'

import { useEffect, useRef, useState } from 'react'
import { renameFolder } from '@/app/folders/actions'

interface RenameFolderButtonProps {
  folderId: string
  currentName: string
}

export function RenameFolderButton({ folderId, currentName }: RenameFolderButtonProps) {
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.select()
  }, [open])

  // Await the action, then close (closing first would unmount the form and
  // cancel the pending server action).
  async function handleRename(formData: FormData): Promise<void> {
    await renameFolder(formData)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-slate-500 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
      >
        Renommer
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Renommer le dossier"
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Renommer le dossier
            </h2>
            <form action={handleRename} className="mt-4">
              <input type="hidden" name="id" value={folderId} />
              <label htmlFor="rename-input" className="sr-only">
                Nom du dossier
              </label>
              <input
                id="rename-input"
                ref={inputRef}
                name="name"
                required
                maxLength={100}
                defaultValue={currentName}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
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
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                >
                  Renommer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
