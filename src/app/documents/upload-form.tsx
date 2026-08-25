'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { uploadDocumentFiles } from '@/app/documents/upload-client'
import { ScanButton } from '@/app/scan-button'

interface UploadFormProps {
  /** Optional target folder; uploads land here when set. */
  folderId?: string
}

export function UploadForm({ folderId }: UploadFormProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [scanCount, setScanCount] = useState(0)

  function handleCapture(photo: File): void {
    const input = formRef.current?.elements.namedItem('file') as HTMLInputElement | null
    if (!input) return
    const dt = new DataTransfer()
    Array.from(input.files ?? []).forEach((f) => dt.items.add(f))
    dt.items.add(photo)
    input.files = dt.files
    setScanCount((n) => n + 1)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setError(null)
    setMessage(null)

    const input = formRef.current?.elements.namedItem('file') as HTMLInputElement | null
    const files = Array.from(input?.files ?? [])
    if (files.length === 0) {
      setError('Choisis au moins un fichier à téléverser.')
      return
    }

    setPending(true)
    try {
      const result = await uploadDocumentFiles(files, folderId, (done, total) =>
        setMessage(`Téléversement ${done}/${total}…`),
      )
      if (result.added > 0) {
        formRef.current?.reset()
        setScanCount(0)
        router.refresh()
      }
      setMessage(
        result.added > 0
          ? `${result.added} document${result.added > 1 ? 's' : ''} ajouté${result.added > 1 ? 's' : ''}.`
          : null,
      )
      setError(result.error ?? null)
    } catch {
      setError('Le téléversement a échoué. Réessaie.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="rounded-xl border border-dashed border-slate-300 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="file"
          name="file"
          required
          multiple
          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100 dark:text-slate-400 dark:file:bg-indigo-950/50 dark:file:text-indigo-300"
        />
        <ScanButton onCapture={handleCapture} disabled={pending} />
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

      {scanCount > 0 && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {scanCount} photo{scanCount > 1 ? 's' : ''} scannée{scanCount > 1 ? 's' : ''} ajoutée
          {scanCount > 1 ? 's' : ''}.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">
          {message}
        </p>
      )}
    </form>
  )
}
