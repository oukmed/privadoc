'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { jsPDF } from 'jspdf'
import { uploadDocumentFile } from '@/app/documents/upload-client'

interface ScanButtonProps {
  folderId?: string
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('read failed'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image failed'))
    img.src = src
  })
}

function pdfFormat(dataUrl: string): 'JPEG' | 'PNG' | 'WEBP' {
  const header = dataUrl.slice(5, dataUrl.indexOf(';'))
  if (header.includes('png')) return 'PNG'
  if (header.includes('webp')) return 'WEBP'
  return 'JPEG'
}

/** Build a single A4 PDF, one captured page per PDF page (fit + centered). */
async function pagesToPdf(dataUrls: string[]): Promise<Blob> {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const margin = 24

  for (let i = 0; i < dataUrls.length; i++) {
    const img = await loadImage(dataUrls[i])
    const ratio = Math.min((pageW - margin * 2) / img.width, (pageH - margin * 2) / img.height)
    const w = img.width * ratio
    const h = img.height * ratio
    if (i > 0) pdf.addPage()
    pdf.addImage(dataUrls[i], pdfFormat(dataUrls[i]), (pageW - w) / 2, (pageH - h) / 2, w, h)
  }

  return pdf.output('blob')
}

export function ScanButton({ folderId }: ScanButtonProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pages, setPages] = useState<string[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleCapture(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0]
    event.target.value = '' // allow capturing again
    if (!file || !file.type.startsWith('image/')) return
    setError(null)
    setMessage(null)
    try {
      const dataUrl = await readAsDataURL(file)
      setPages((prev) => [...prev, dataUrl])
    } catch {
      setError('Impossible de lire la photo.')
    }
  }

  async function createPdf(): Promise<void> {
    if (pages.length === 0) return
    setPending(true)
    setError(null)
    try {
      const pdf = await pagesToPdf(pages)
      const name = `Scan ${new Date().toISOString().slice(0, 10)}.pdf`
      const result = await uploadDocumentFile(pdf, name, folderId)
      if (result?.error) {
        setError(result.error)
        return
      }
      setMessage(`Scan ajouté (${pages.length} page${pages.length > 1 ? 's' : ''}).`)
      setPages([])
      router.refresh()
    } catch {
      setError('Le scan a échoué. Réessaie.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      {/* capture="environment" opens the rear camera directly on mobile. */}
      <input ref={inputRef} type="file" accept="image/*" capture="environment" hidden onChange={handleCapture} />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Prends une photo par page → un seul PDF.
        </p>
        {pages.length === 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-4">
              <path
                d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
            </svg>
            Scanner un document
          </button>
        )}
      </div>

      {pages.length > 0 && (
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {pages.map((src, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Page ${i + 1}`}
                  className="size-16 rounded-md border border-slate-200 object-cover dark:border-slate-700"
                />
                <button
                  type="button"
                  onClick={() => setPages((prev) => prev.filter((_, j) => j !== i))}
                  aria-label={`Retirer la page ${i + 1}`}
                  className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-slate-900 text-white shadow dark:bg-slate-700"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="size-3" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={pending}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              + Ajouter une page
            </button>
            <button
              type="button"
              onClick={createPdf}
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending && (
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-4 animate-spin">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              )}
              {pending ? 'Création du PDF…' : `Créer le PDF (${pages.length})`}
            </button>
            <button
              type="button"
              onClick={() => setPages([])}
              disabled={pending}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:text-slate-700 disabled:opacity-60 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Annuler
            </button>
          </div>
        </div>
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
    </div>
  )
}
