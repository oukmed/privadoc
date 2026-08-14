'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { createShare, type ShareState } from '@/app/documents/share-actions'

interface ShareButtonProps {
  documentId: string
}

export function ShareButton({ documentId }: ShareButtonProps) {
  const [state, action, pending] = useActionState<ShareState, FormData>(createShare, undefined)
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

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
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400"
      >
        Partager
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
            aria-labelledby="share-title"
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between">
              <h2
                id="share-title"
                className="text-lg font-semibold text-slate-900 dark:text-slate-50"
              >
                Partager le document
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="rounded-md p-1 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
              >
                <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {state?.url ? (
              <div className="mt-5">
                <label
                  htmlFor="share-url"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Lien de partage
                </label>
                <input
                  id="share-url"
                  readOnly
                  value={state.url}
                  onFocus={(e) => e.currentTarget.select()}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
                <button
                  type="button"
                  onClick={() => copy(state.url ?? '')}
                  className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                >
                  {copied ? 'Lien copié' : 'Copier'}
                </button>
              </div>
            ) : (
              <form action={action} className="mt-5 flex flex-col gap-4">
                <input type="hidden" name="documentId" value={documentId} />

                <div>
                  <label
                    htmlFor="share-expiry"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Expiration
                  </label>
                  <select
                    id="share-expiry"
                    name="expiry"
                    defaultValue="7d"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="24h">24 heures</option>
                    <option value="7d">7 jours</option>
                    <option value="30d">30 jours</option>
                    <option value="never">Jamais</option>
                  </select>
                </div>

                <fieldset>
                  <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Autorisation
                  </legend>
                  <div className="mt-1.5 flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <input
                        type="radio"
                        name="permission"
                        value="read"
                        defaultChecked
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      Lecture seule
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <input
                        type="radio"
                        name="permission"
                        value="write"
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      Modification
                    </label>
                  </div>
                </fieldset>

                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? 'Création…' : 'Générer le lien'}
                </button>
              </form>
            )}

            {state?.error && (
              <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
                {state.error}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
