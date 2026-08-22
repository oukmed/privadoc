'use client'

import { useState } from 'react'
import { moveDocument } from '@/app/documents/actions'

interface MoveDialogProps {
  documentId: string
  /** Current folder of the document ('' = root) — preselected & hidden from choices. */
  currentFolderId: string
  /** All of the user's folders, as move destinations. */
  folders: { id: string; name: string }[]
}

export function MoveDialog({ documentId, currentFolderId, folders }: MoveDialogProps) {
  const [open, setOpen] = useState(false)

  // Close after the action resolves (closing first unmounts the pending form).
  async function handleMove(formData: FormData): Promise<void> {
    await moveDocument(formData)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-slate-500 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
      >
        Déplacer
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
            aria-label="Déplacer le document"
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Déplacer vers un dossier
            </h2>
            <form action={handleMove} className="mt-4">
              <input type="hidden" name="id" value={documentId} />
              <label htmlFor="move-folder" className="sr-only">
                Dossier de destination
              </label>
              <select
                id="move-folder"
                name="folderId"
                defaultValue={currentFolderId}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="">Racine (aucun dossier)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
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
                  Déplacer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
