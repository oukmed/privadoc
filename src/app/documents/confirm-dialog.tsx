'use client'

import { useEffect, useId, useRef, useState } from 'react'

interface ConfirmDialogProps {
  /** Label of the button that opens the dialog. */
  triggerLabel: string
  title: string
  description: string
  /** Label of the confirming submit button inside the dialog. */
  confirmLabel: string
  /** Server action bound to the confirm form. */
  action: (formData: FormData) => void | Promise<void>
  /** Rendered as hidden inputs inside the form (e.g. the row id). */
  hiddenFields?: Record<string, string>
  /** Styles the trigger and confirm button as a destructive (red) action. */
  destructive?: boolean
}

export function ConfirmDialog({
  triggerLabel,
  title,
  description,
  confirmLabel,
  action,
  hiddenFields,
  destructive = false,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  // Move focus into the dialog on open; restore it to the trigger on close.
  useEffect(() => {
    if (!open) return
    const trigger = triggerRef.current
    confirmRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      trigger?.focus()
    }
  }, [open])

  // Run the action to completion FIRST, then close. Closing in the submit
  // button's onClick unmounts the form before the server action dispatches,
  // which silently cancels it.
  async function handleConfirm(formData: FormData): Promise<void> {
    await action(formData)
    setOpen(false)
  }

  const triggerClass = destructive
    ? 'text-sm font-medium text-red-600 transition hover:text-red-500 dark:text-red-400 dark:hover:text-red-300'
    : 'text-sm font-medium text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300'

  const confirmClass = destructive
    ? 'rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900'
    : 'rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900'

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)} className={triggerClass}>
        {triggerLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900"
          >
            <h2 id={titleId} className="text-base font-semibold text-slate-900 dark:text-slate-50">
              {title}
            </h2>
            <p id={descriptionId} className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {description}
            </p>

            <form action={handleConfirm} className="mt-6 flex justify-end gap-3">
              {hiddenFields &&
                Object.entries(hiddenFields).map(([name, value]) => (
                  <input key={name} type="hidden" name={name} value={value} />
                ))}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Annuler
              </button>
              <button ref={confirmRef} type="submit" className={confirmClass}>
                {confirmLabel}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
