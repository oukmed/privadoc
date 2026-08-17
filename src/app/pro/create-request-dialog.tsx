'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { createRequest, type RequestState } from '@/app/pro/actions'

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300'

let rowSeq = 0
function newRowId(): number {
  rowSeq += 1
  return rowSeq
}

export function CreateRequestDialog() {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState<RequestState, FormData>(createRequest, undefined)
  const [seenState, setSeenState] = useState(state)
  const [rows, setRows] = useState<number[]>([newRowId()])
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

  // Close + reset the rows once the request is created (adjust state during
  // render — each dispatch returns a new state reference, fires once per result).
  if (state !== seenState) {
    setSeenState(state)
    if (state?.message) {
      setOpen(false)
      setRows([newRowId()])
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4">
          <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        Nouvelle demande
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
            aria-labelledby="request-dialog-title"
            className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between">
              <h2
                id="request-dialog-title"
                className="text-lg font-semibold text-slate-900 dark:text-slate-50"
              >
                Nouvelle demande de pièces
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="rounded-md p-1 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
              >
                <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <form action={action} className="mt-5 flex min-h-0 flex-col gap-4 overflow-y-auto">
              <div>
                <label htmlFor="request-client" className={labelClass}>
                  Adresse email du client
                </label>
                <input
                  id="request-client"
                  name="clientEmail"
                  type="email"
                  required
                  placeholder="client@exemple.fr"
                  className={`mt-1.5 ${inputClass}`}
                />
              </div>

              <div>
                <label htmlFor="request-title" className={labelClass}>
                  Titre de la demande
                </label>
                <input
                  id="request-title"
                  name="title"
                  type="text"
                  required
                  maxLength={200}
                  placeholder="Dossier de prêt immobilier"
                  className={`mt-1.5 ${inputClass}`}
                />
              </div>

              <fieldset className="min-h-0">
                <legend className={labelClass}>Pièces à fournir</legend>
                <div className="mt-1.5 flex flex-col gap-2">
                  {rows.map((rowId) => (
                    <div key={rowId} className="flex items-center gap-2">
                      <input
                        name="label"
                        type="text"
                        placeholder="Ex. Dernier avis d'imposition"
                        className={`flex-1 ${inputClass}`}
                      />
                      <input
                        name="dueDate"
                        type="date"
                        aria-label="Échéance (optionnelle)"
                        className={`w-40 ${inputClass}`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setRows((prev) => (prev.length > 1 ? prev.filter((r) => r !== rowId) : prev))
                        }
                        aria-label="Retirer cette pièce"
                        className="shrink-0 rounded p-1.5 text-slate-400 transition hover:text-red-600 dark:hover:text-red-400"
                      >
                        <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
                          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setRows((prev) => [...prev, newRowId()])}
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400"
                >
                  + Ajouter une pièce
                </button>
              </fieldset>

              <button
                type="submit"
                disabled={pending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? 'Création…' : 'Créer la demande'}
              </button>
              {state?.error && (
                <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                  {state.error}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  )
}
