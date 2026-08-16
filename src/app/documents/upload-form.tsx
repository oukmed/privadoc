'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { registerDocument } from '@/app/documents/actions'

interface UploadFormProps {
  /** Optional target folder; uploads land here when set. */
  folderId?: string
}

const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? 'documents'
const MAX_FILE_BYTES = 20 * 1024 * 1024 // 20 MB

const DANGEROUS_CONTENT_TYPES = new Set([
  'text/html',
  'application/xhtml+xml',
  'image/svg+xml',
  'application/xml',
  'text/xml',
])

function safeContentType(type: string): string {
  return !type || DANGEROUS_CONTENT_TYPES.has(type.toLowerCase()) ? 'application/octet-stream' : type
}

function fileExtension(name: string): string {
  const dot = name.lastIndexOf('.')
  if (dot <= 0) return ''
  const ext = name.slice(dot + 1).toLowerCase()
  return /^[a-z0-9]{1,12}$/.test(ext) ? `.${ext}` : ''
}

export function UploadForm({ folderId }: UploadFormProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Upload straight from the browser to Supabase Storage (no Vercel function in
  // the file path → no 1MB/timeout limits), then record the row server-side.
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setError(null)
    setMessage(null)

    const input = formRef.current?.elements.namedItem('file') as HTMLInputElement | null
    const file = input?.files?.[0]
    if (!file) {
      setError('Choisis un fichier à téléverser.')
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('Fichier trop volumineux (max 20 Mo).')
      return
    }

    setPending(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError('Session expirée, reconnecte-toi.')
        return
      }

      const contentType = safeContentType(file.type)
      const path = `${user.id}/${crypto.randomUUID()}${fileExtension(file.name)}`

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType, upsert: false })
      if (uploadError) {
        setError('Le téléversement a échoué : ' + uploadError.message)
        return
      }

      const result = await registerDocument({
        title: file.name,
        storagePath: path,
        mimeType: contentType,
        sizeBytes: file.size,
        folderId,
      })
      if (result?.error) {
        setError(result.error)
        return
      }

      setMessage('Document ajouté.')
      formRef.current?.reset()
      router.refresh()
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
          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100 dark:text-slate-400 dark:file:bg-indigo-950/50 dark:file:text-indigo-300"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending && (
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-4 animate-spin">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path
                d="M21 12a9 9 0 0 0-9-9"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          )}
          {pending ? 'Téléversement…' : 'Téléverser'}
        </button>
      </div>

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
