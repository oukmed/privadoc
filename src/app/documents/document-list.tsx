'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ConfirmDialog } from '@/app/documents/confirm-dialog'
import { RenameDialog } from '@/app/documents/rename-dialog'
import { ShareDialog } from '@/app/documents/share-dialog'
import { deleteDocument, deleteSelection, renameDocument } from '@/app/documents/actions'
import { deleteFolder, renameFolder } from '@/app/folders/actions'

interface FolderItem {
  id: string
  name: string
}

interface DocumentItem {
  id: string
  title: string
  storagePath: string
  sizeBytes: number | null
  createdAt: string
  signedUrl?: string
}

interface DocumentListProps {
  folders: FolderItem[]
  documents: DocumentItem[]
  sharedDocuments?: DocumentItem[]
}

const ZIP_ENDPOINT = '/api/documents/zip'

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(value < 10 && unit > 0 ? 1 : 0)} ${units[unit]}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function badgeStyle(ext: string): string {
  if (ext === 'pdf')
    return 'bg-red-50 text-red-600 ring-red-200/70 dark:bg-red-950/40 dark:text-red-400 dark:ring-red-900/50'
  if (['doc', 'docx', 'txt', 'rtf'].includes(ext))
    return 'bg-blue-50 text-blue-600 ring-blue-200/70 dark:bg-blue-950/40 dark:text-blue-400 dark:ring-blue-900/50'
  if (['xls', 'xlsx', 'csv'].includes(ext))
    return 'bg-emerald-50 text-emerald-600 ring-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900/50'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic', 'svg'].includes(ext))
    return 'bg-violet-50 text-violet-600 ring-violet-200/70 dark:bg-violet-950/40 dark:text-violet-400 dark:ring-violet-900/50'
  if (['zip', 'rar', '7z'].includes(ext))
    return 'bg-amber-50 text-amber-600 ring-amber-200/70 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900/50'
  return 'bg-slate-100 text-slate-500 ring-slate-200/70 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700/60'
}

function FileBadge({ title }: { title: string }) {
  const dot = title.lastIndexOf('.')
  const ext = dot > 0 ? title.slice(dot + 1).toLowerCase() : ''
  const label = (ext || 'doc').slice(0, 4).toUpperCase()
  return (
    <span
      aria-hidden="true"
      className={`grid size-9 shrink-0 place-items-center rounded-lg text-[10px] font-bold ring-1 ring-inset ${badgeStyle(ext)}`}
    >
      {label}
    </span>
  )
}

function toggleInSet(set: Set<string>, id: string): Set<string> {
  const next = new Set(set)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}

const rowCheckboxClass = 'size-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600'

export function DocumentList({ folders, documents, sharedDocuments }: DocumentListProps) {
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set())
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set())
  const [shareTargets, setShareTargets] = useState<string[] | null>(null)
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const [zipping, setZipping] = useState(false)
  const [zipError, setZipError] = useState<string | null>(null)

  const totalCount = folders.length + documents.length
  const selectedCount = selectedDocs.size + selectedFolders.size
  const allSelected = totalCount > 0 && selectedCount === totalCount

  function clearSelection(): void {
    setSelectedDocs(new Set())
    setSelectedFolders(new Set())
  }

  function toggleAll(): void {
    if (allSelected) {
      clearSelection()
    } else {
      setSelectedDocs(new Set(documents.map((d) => d.id)))
      setSelectedFolders(new Set(folders.map((f) => f.id)))
    }
  }

  async function downloadZip(): Promise<void> {
    const ids = [...selectedDocs]
    if (ids.length === 0) return
    setZipping(true)
    setZipError(null)
    try {
      const response = await fetch(ZIP_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        setZipError(data?.error ?? 'Le téléchargement a échoué.')
        return
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `privadoc-${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch {
      setZipError('Le téléchargement a échoué.')
    } finally {
      setZipping(false)
    }
  }

  async function handleBulkDelete(formData: FormData): Promise<void> {
    await deleteSelection(formData)
    setBulkConfirm(false)
    clearSelection()
  }

  return (
    <>
      {sharedDocuments && sharedDocuments.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-950/40">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Partagé avec moi
            </span>
          </div>
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {sharedDocuments.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <FileBadge title={doc.title} />
                <div className="min-w-0 flex-1">
                  {doc.signedUrl ? (
                    <a
                      href={doc.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-sm font-medium text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
                    >
                      {doc.title}
                    </a>
                  ) : (
                    <p className="block truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {doc.title}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="whitespace-nowrap">{formatBytes(doc.sizeBytes)}</span>
                    {' · '}
                    <span className="whitespace-nowrap">{formatDate(doc.createdAt)}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-950/40">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = selectedCount > 0 && !allSelected
            }}
            onChange={toggleAll}
            aria-label="Tout sélectionner"
            className={rowCheckboxClass}
          />
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {selectedCount > 0 ? `${selectedCount} sélectionné(s)` : 'Tout sélectionner'}
          </span>
        </div>

        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
          {folders.map((folder) => (
            <li
              key={folder.id}
              className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-3 dark:hover:bg-slate-800/40"
            >
              <div className="flex min-w-0 items-center gap-3 sm:flex-1">
                <input
                  type="checkbox"
                  checked={selectedFolders.has(folder.id)}
                  onChange={() => setSelectedFolders((prev) => toggleInSet(prev, folder.id))}
                  aria-label={`Sélectionner le dossier ${folder.name}`}
                  className={rowCheckboxClass}
                />
                <Link
                  href={`/?folder=${folder.id}`}
                  className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
                >
                  <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-4 shrink-0 text-indigo-500">
                    <path d="M3 6a2 2 0 0 1 2-2h3l2 2h5a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z" />
                  </svg>
                  <span className="truncate">{folder.name}</span>
                </Link>
              </div>
              <div className="flex shrink-0 items-center gap-4 self-end sm:self-auto">
                <RenameDialog action={renameFolder} id={folder.id} currentName={folder.name} noun="dossier" />
                <ConfirmDialog
                  triggerLabel="Supprimer"
                  title="Supprimer le dossier"
                  description="Le dossier et ses sous-dossiers seront supprimés. Les documents qu'il contient ne seront pas supprimés mais déplacés à la racine."
                  confirmLabel="Supprimer"
                  action={deleteFolder}
                  hiddenFields={{ id: folder.id }}
                  destructive
                />
              </div>
            </li>
          ))}

          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-3 dark:hover:bg-slate-800/40"
            >
              <div className="flex min-w-0 items-center gap-3 sm:flex-1">
                <input
                  type="checkbox"
                  checked={selectedDocs.has(doc.id)}
                  onChange={() => setSelectedDocs((prev) => toggleInSet(prev, doc.id))}
                  aria-label={`Sélectionner le document ${doc.title}`}
                  className={rowCheckboxClass}
                />
                <FileBadge title={doc.title} />
                <div className="min-w-0 flex-1">
                  {doc.signedUrl ? (
                    <a
                      href={doc.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-sm font-medium text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
                    >
                      {doc.title}
                    </a>
                  ) : (
                    <p className="block truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {doc.title}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="whitespace-nowrap">{formatBytes(doc.sizeBytes)}</span>
                    {' · '}
                    <span className="whitespace-nowrap">{formatDate(doc.createdAt)}</span>
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-4 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setShareTargets([doc.id])}
                  className="text-sm font-medium text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400"
                >
                  Partager
                </button>
                <RenameDialog action={renameDocument} id={doc.id} currentName={doc.title} noun="document" />
                <ConfirmDialog
                  triggerLabel="Supprimer"
                  title="Supprimer le document"
                  description="Cette action est définitive. Le fichier sera retiré de ton espace de stockage."
                  confirmLabel="Supprimer"
                  action={deleteDocument}
                  hiddenFields={{ id: doc.id }}
                  destructive
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      {selectedCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-6">
          <div className="flex w-full max-w-2xl flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={clearSelection}
                aria-label="Annuler la sélection"
                className="rounded-md p-1 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
              >
                <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {selectedCount} élément(s) sélectionné(s)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShareTargets([...selectedDocs])}
                disabled={selectedDocs.size === 0}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Partager la sélection
              </button>
              <button
                type="button"
                onClick={downloadZip}
                disabled={selectedDocs.size === 0 || zipping}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {zipping && (
                  <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
                  </svg>
                )}
                {zipping ? 'Préparation du ZIP…' : 'Télécharger en ZIP'}
              </button>
              <button
                type="button"
                onClick={() => setBulkConfirm(true)}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                Supprimer la sélection
              </button>
            </div>
          </div>
          {zipError && (
            <p role="alert" className="sr-only">
              {zipError}
            </p>
          )}
        </div>
      )}

      {zipError && (
        <div
          role="alert"
          className="fixed inset-x-0 bottom-24 z-50 mx-auto w-fit rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 shadow-lg dark:border-red-800 dark:bg-red-950/60 dark:text-red-300"
        >
          {zipError}
        </div>
      )}

      {bulkConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setBulkConfirm(false)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-delete-title"
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <h2 id="bulk-delete-title" className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Supprimer la sélection
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {selectedCount} élément(s) seront supprimés. Cette action est définitive pour les documents.
            </p>
            <form action={handleBulkDelete} className="mt-6 flex justify-end gap-3">
              {[...selectedDocs].map((id) => (
                <input key={id} type="hidden" name="documentIds" value={id} />
              ))}
              {[...selectedFolders].map((id) => (
                <input key={id} type="hidden" name="folderIds" value={id} />
              ))}
              <button
                type="button"
                onClick={() => setBulkConfirm(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
              >
                Supprimer
              </button>
            </form>
          </div>
        </div>
      )}

      {shareTargets && (
        <ShareDialog
          key={shareTargets.join(',')}
          documentIds={shareTargets}
          open
          onClose={() => setShareTargets(null)}
        />
      )}
    </>
  )
}
