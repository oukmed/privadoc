'use client'

import { useActionState, useState } from 'react'
import { createRequest, type RequestState } from '@/app/pro/actions'
import { ButtonLink } from '@/app/pro/ui'

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300'

let rowSeq = 0
function newRowId(): number {
  rowSeq += 1
  return rowSeq
}

export function NewRequestForm() {
  const [state, action, pending] = useActionState<RequestState, FormData>(createRequest, undefined)
  const [rows, setRows] = useState<number[]>([newRowId()])

  return (
    <form action={action} className="flex flex-col gap-6 p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="request-client-name" className={labelClass}>
            Nom du client
          </label>
          <input
            id="request-client-name"
            name="clientName"
            type="text"
            required
            maxLength={120}
            placeholder="Ex. Lina Bernard"
            className={`mt-1.5 ${inputClass}`}
          />
        </div>

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

      <fieldset>
        <legend className={labelClass}>Pièces à fournir</legend>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Le client déposera un document pour chaque pièce listée ci-dessous.
        </p>
        <div className="mt-3 flex flex-col gap-3">
          {rows.map((rowId, index) => (
            <div
              key={rowId}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Pièce {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r !== rowId) : prev))
                  }
                  aria-label="Retirer cette pièce"
                  className="rounded p-1 text-slate-400 transition hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-40 dark:hover:text-red-400"
                  disabled={rows.length <= 1}
                >
                  <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
              <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_auto]">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                    Nom de la pièce
                  </label>
                  <input
                    name="label"
                    type="text"
                    required
                    placeholder="Ex. Dernier avis d'imposition"
                    className={`mt-1 ${inputClass}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                    Échéance <span className="font-normal text-slate-400">(facultatif)</span>
                  </label>
                  <input name="dueDate" type="date" className={`mt-1 ${inputClass}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, newRowId()])}
          className="mt-3 inline-flex items-center gap-1 rounded text-sm font-medium text-indigo-600 transition hover:text-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-400"
        >
          + Ajouter une pièce
        </button>
      </fieldset>

      {state?.error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          {state.error}
        </p>
      )}
      {state?.message && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 dark:border-emerald-900/50 dark:bg-emerald-950/40">
          <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">
            {state.message}
          </p>
          <ButtonLink href="/pro/demandes" size="sm">
            Voir mes demandes
          </ButtonLink>
        </div>
      )}

      <div className="flex justify-end border-t border-slate-200 pt-5 dark:border-slate-800">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-900"
        >
          {pending ? 'Création…' : 'Créer la demande'}
        </button>
      </div>
    </form>
  )
}
