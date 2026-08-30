'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { createShareLink, sendShareEmail, type ShareState } from '@/app/documents/share-actions'
import { useT } from '@/lib/i18n/client'

interface ShareDialogProps {
  documentIds: string[]
  open: boolean
  onClose: () => void
  /** When true, the sender has no saved name yet — ask for it (email tab). */
  needsName?: boolean
}

type Tab = 'link' | 'email'

const RECIPIENT_ROLES = [
  { value: 'avocat', labelKey: 'vault.share.role.avocat' },
  { value: 'comptable', labelKey: 'vault.share.role.comptable' },
  { value: 'banque', labelKey: 'vault.share.role.banque' },
  { value: 'notaire', labelKey: 'vault.share.role.notaire' },
  { value: 'administration', labelKey: 'vault.share.role.administration' },
  { value: 'autre', labelKey: 'vault.share.role.autre' },
] as const

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300'

function HiddenIds({ ids }: { ids: string[] }) {
  return (
    <>
      {ids.map((id) => (
        <input key={id} type="hidden" name="documentIds" value={id} />
      ))}
    </>
  )
}

export function ShareDialog({ documentIds, open, onClose, needsName }: ShareDialogProps) {
  const t = useT()
  const [tab, setTab] = useState<Tab>('link')
  const [copied, setCopied] = useState(false)
  const [linkState, linkAction, linkPending] = useActionState<ShareState, FormData>(
    createShareLink,
    undefined,
  )
  const [emailState, emailAction, emailPending] = useActionState<ShareState, FormData>(
    sendShareEmail,
    undefined,
  )
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const count = documentIds.length
  const title =
    count > 1
      ? t('vault.share.titleMany', { count })
      : t('vault.share.titleOne')
  const defaultSubject = t('vault.share.subject')
  const defaultMessage = t('vault.share.message')

  async function copy(url: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const tabClass = (active: boolean): string =>
    active
      ? 'flex-1 border-b-2 border-indigo-600 px-3 py-2 text-sm font-semibold text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
      : 'flex-1 border-b-2 border-transparent px-3 py-2 text-sm font-medium text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-dialog-title"
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between">
          <h2
            id="share-dialog-title"
            className="text-lg font-semibold text-slate-900 dark:text-slate-50"
          >
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t('vault.share.close')}
            className="rounded-md p-1 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
          >
            <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mt-4 flex border-b border-slate-200 dark:border-slate-800" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'link'}
            onClick={() => setTab('link')}
            className={tabClass(tab === 'link')}
          >
            {t('vault.share.tabLink')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'email'}
            onClick={() => setTab('email')}
            className={tabClass(tab === 'email')}
          >
            {t('vault.share.tabEmail')}
          </button>
        </div>

        {tab === 'link' ? (
          <div className="mt-5">
            {linkState?.url ? (
              <div>
                <label htmlFor="share-url" className={labelClass}>
                  {t('vault.share.linkLabel')}
                </label>
                <input
                  id="share-url"
                  readOnly
                  value={linkState.url}
                  onFocus={(e) => e.currentTarget.select()}
                  className={`mt-1.5 ${inputClass} bg-slate-50 dark:bg-slate-800`}
                />
                <button
                  type="button"
                  onClick={() => copy(linkState.url ?? '')}
                  className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                >
                  {copied ? t('vault.share.copied') : t('vault.share.copy')}
                </button>
              </div>
            ) : (
              <form action={linkAction} className="flex flex-col gap-4">
                <HiddenIds ids={documentIds} />
                <div>
                  <label htmlFor="link-expiry" className={labelClass}>
                    {t('vault.share.expiry')}
                  </label>
                  <select id="link-expiry" name="expiry" defaultValue="7d" className={`mt-1.5 ${inputClass}`}>
                    <option value="24h">{t('vault.share.expiry24h')}</option>
                    <option value="7d">{t('vault.share.expiry7d')}</option>
                    <option value="30d">{t('vault.share.expiry30d')}</option>
                    <option value="never">{t('vault.share.expiryNever')}</option>
                  </select>
                </div>
                <fieldset>
                  <legend className={labelClass}>{t('vault.share.permission')}</legend>
                  <div className="mt-1.5 flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <input
                        type="radio"
                        name="permission"
                        value="read"
                        defaultChecked
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      {t('vault.share.readOnly')}
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <input
                        type="radio"
                        name="permission"
                        value="write"
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      {t('vault.share.write')}
                    </label>
                  </div>
                </fieldset>
                <button
                  type="submit"
                  disabled={linkPending}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {linkPending ? t('vault.share.creating') : t('vault.share.generateLink')}
                </button>
              </form>
            )}
            {linkState?.error && (
              <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
                {linkState.error}
              </p>
            )}
          </div>
        ) : (
          <div className="mt-5">
            {emailState?.message ? (
              <p
                role="status"
                className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
              >
                {emailState.message}
              </p>
            ) : (
              <form action={emailAction} className="flex flex-col gap-4">
                <HiddenIds ids={documentIds} />
                {needsName && (
                  <div>
                    <label htmlFor="email-sender-name" className={labelClass}>
                      {t('vault.share.senderName')}
                    </label>
                    <input
                      id="email-sender-name"
                      name="senderName"
                      type="text"
                      required
                      maxLength={120}
                      placeholder={t('vault.share.senderNamePlaceholder')}
                      className={`mt-1.5 ${inputClass}`}
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="email-recipient" className={labelClass}>
                    {t('vault.share.recipientEmail')}
                  </label>
                  <input
                    id="email-recipient"
                    name="recipientEmail"
                    type="email"
                    required
                    placeholder="destinataire@exemple.fr"
                    className={`mt-1.5 ${inputClass}`}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="email-role" className={labelClass}>
                      {t('vault.share.role')}
                    </label>
                    <select
                      id="email-role"
                      name="recipientRole"
                      defaultValue="autre"
                      className={`mt-1.5 ${inputClass}`}
                    >
                      {RECIPIENT_ROLES.map((role) => (
                        <option key={role.value} value={role.value}>
                          {t(role.labelKey)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="email-expiry" className={labelClass}>
                      {t('vault.share.expiry')}
                    </label>
                    <select id="email-expiry" name="expiry" defaultValue="7d" className={`mt-1.5 ${inputClass}`}>
                      <option value="24h">{t('vault.share.expiry24h')}</option>
                      <option value="7d">{t('vault.share.expiry7d')}</option>
                      <option value="30d">{t('vault.share.expiry30d')}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="email-subject" className={labelClass}>
                    {t('vault.share.subjectLabel')}
                  </label>
                  <input
                    id="email-subject"
                    name="subject"
                    type="text"
                    defaultValue={defaultSubject}
                    className={`mt-1.5 ${inputClass}`}
                  />
                </div>
                <div>
                  <label htmlFor="email-message" className={labelClass}>
                    {t('vault.share.messageLabel')}
                  </label>
                  <textarea
                    id="email-message"
                    name="message"
                    rows={4}
                    defaultValue={defaultMessage}
                    className={`mt-1.5 ${inputClass} resize-y`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={emailPending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {emailPending && (
                    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
                    </svg>
                  )}
                  {emailPending ? t('vault.share.sending') : t('vault.share.send')}
                </button>
              </form>
            )}
            {emailState?.error && (
              <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
                {emailState.error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
