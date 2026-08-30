'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { submitPiece } from '@/app/requests/actions'
import { safeContentType, fileExtension } from '@/app/documents/upload-client'
import { ScanButton } from '@/app/scan-button'
import { useT } from '@/lib/i18n/client'

const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? 'documents'
const MAX_FILE_BYTES = 20 * 1024 * 1024 // 20 MB

interface SubmitPieceProps {
  item: { id: string; label: string }
}

export function SubmitPiece({ item }: SubmitPieceProps) {
  const t = useT()
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  function handleCapture(photo: File): void {
    const input = formRef.current?.elements.namedItem('file') as HTMLInputElement | null
    if (!input) return
    const dt = new DataTransfer()
    dt.items.add(photo)
    input.files = dt.files
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setError(null)
    setMessage(null)

    const input = formRef.current?.elements.namedItem('file') as HTMLInputElement | null
    const file = input?.files?.[0]
    if (!file) {
      setError(t('inbox.submit.chooseFile'))
      return
    }

    setPending(true)
    try {
      // Reading the real bytes (rather than trusting `file.size`) works around
      // Google Drive "on demand" files reporting size 0 until their content is read.
      let bytes: ArrayBuffer
      try {
        bytes = await file.arrayBuffer()
      } catch {
        setError(t('inbox.submit.unreadable'))
        return
      }
      if (bytes.byteLength === 0) {
        setError(t('inbox.submit.empty'))
        return
      }
      if (bytes.byteLength > MAX_FILE_BYTES) {
        setError(t('inbox.submit.tooLarge'))
        return
      }

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError(t('inbox.submit.sessionExpired'))
        return
      }

      const contentType = safeContentType(file.type)
      const path = `${user.id}/${crypto.randomUUID()}${fileExtension(file.name)}`
      const blob = new Blob([bytes], { type: contentType })

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { contentType, upsert: false })
      if (uploadError) {
        setError(t('inbox.submit.uploadFailed', { message: uploadError.message }))
        return
      }

      const result = await submitPiece({
        itemId: item.id,
        title: file.name,
        storagePath: path,
        mimeType: contentType,
        sizeBytes: bytes.byteLength,
      })
      if (result.error) {
        setError(result.error)
        return
      }

      formRef.current?.reset()
      setMessage(t('inbox.submit.deposited'))
      router.refresh()
    } catch {
      setError(t('inbox.submit.failed'))
    } finally {
      setPending(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
      <label htmlFor={`file-${item.id}`} className="sr-only">
        {t('inbox.submit.fileFor', { label: item.label })}
      </label>
      <input
        id={`file-${item.id}`}
        type="file"
        name="file"
        required
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
        {pending ? t('inbox.submit.depositing') : t('inbox.submit.deposit')}
      </button>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">
          {message}
        </p>
      )}
    </form>
  )
}
