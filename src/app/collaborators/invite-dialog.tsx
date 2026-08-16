'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { inviteCollaborator, type CollaboratorState } from '@/app/collaborators/actions'
import { RECIPIENT_ROLES, ROLE_LABELS } from '@/lib/roles'

interface InviteDialogProps {
  documents: { id: string; title: string }[]
  folders: { id: string; name: string }[]
}

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300'

export function InviteDialog({ documents, folders }: InviteDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState<CollaboratorState, FormData>(
    inviteCollaborator,
    undefined,
  )
  const [seenState, setSeenState] = useState(state)
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

  // Close automatically once the invitation is sent (adjust state during render —
  // each dispatch returns a new state reference, so this fires once per result).
  if (state !== seenState) {
    setSeenState(state)
    if (state?.message) setOpen(false)
  }

  const hasTargets = documents.length > 0 || folders.length > 0

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4">
          <path
            d="M10 4v12M4 10h12"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
        Inviter un collaborateur
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
            aria-labelledby="invite-dialog-title"
            className="flex max-h-[90vh] w-full max-w-md flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between">
              <h2
                id="invite-dialog-title"
                className="text-lg font-semibold text-slate-900 dark:text-slate-50"
              >
                Inviter un collaborateur
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

            {hasTargets ? (
              <form action={action} className="mt-5 flex min-h-0 flex-col gap-4">
                <div>
                  <label htmlFor="invite-email" className={labelClass}>
                    Adresse email du collaborateur
                  </label>
                  <input
                    id="invite-email"
                    name="email"
                    type="email"
                    required
                    placeholder="collaborateur@exemple.fr"
                    className={`mt-1.5 ${inputClass}`}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="invite-role" className={labelClass}>
                      Rôle
                    </label>
                    <select
                      id="invite-role"
                      name="role"
                      defaultValue="autre"
                      className={`mt-1.5 ${inputClass}`}
                    >
                      {RECIPIENT_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="invite-expiry" className={labelClass}>
                      Expiration de l&apos;accès
                    </label>
                    <select
                      id="invite-expiry"
                      name="expiry"
                      defaultValue="never"
                      className={`mt-1.5 ${inputClass}`}
                    >
                      <option value="never">Jamais</option>
                      <option value="30d">30 jours</option>
                      <option value="90d">90 jours</option>
                      <option value="365d">1 an</option>
                    </select>
                  </div>
                </div>

                <fieldset className="min-h-0">
                  <legend className={labelClass}>Documents et dossiers partagés</legend>
                  <div className="mt-1.5 max-h-52 overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                    {folders.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {folders.map((folder) => (
                          <label
                            key={folder.id}
                            className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                          >
                            <input
                              type="checkbox"
                              name="folderIds"
                              value={folder.id}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 20 20"
                              fill="none"
                              className="size-4 text-slate-400"
                            >
                              <path
                                d="M3 6a2 2 0 0 1 2-2h3l2 2h5a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              />
                            </svg>
                            <span className="truncate">{folder.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {folders.length > 0 && documents.length > 0 && (
                      <hr className="my-3 border-slate-200 dark:border-slate-700" />
                    )}
                    {documents.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {documents.map((doc) => (
                          <label
                            key={doc.id}
                            className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                          >
                            <input
                              type="checkbox"
                              name="documentIds"
                              value={doc.id}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 20 20"
                              fill="none"
                              className="size-4 text-slate-400"
                            >
                              <path
                                d="M6 3.5h5l3 3v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1Z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <span className="truncate">{doc.title}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </fieldset>

                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending && (
                    <svg
                      className="size-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
                      />
                    </svg>
                  )}
                  {pending ? 'Envoi en cours…' : "Envoyer l'invitation"}
                </button>
                {state?.error && (
                  <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                    {state.error}
                  </p>
                )}
              </form>
            ) : (
              <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
                Ajoute d&apos;abord un document ou un dossier avant d&apos;inviter un collaborateur.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
