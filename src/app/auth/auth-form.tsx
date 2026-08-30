'use client'

import { useActionState, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import type { AuthState } from '@/app/auth/actions'
import { Brand } from '@/app/brand'
import { useT } from '@/lib/i18n/client'

interface AuthFormProps {
  title: string
  subtitle: string
  submitLabel: string
  action: (state: AuthState, formData: FormData) => Promise<AuthState>
  /** Autocomplete hint for the password field: 'current-password' | 'new-password'. */
  passwordAutoComplete: 'current-password' | 'new-password'
  footer: ReactNode
  /** Relative path to redirect to after auth (defaults to '/' server-side). */
  next?: string
  /** When set, shows a "Mot de passe oublié ?" link pointing here. */
  forgotHref?: string
  /** When true, shows a required "Nom" field (name="displayName") — used on signup. */
  showName?: boolean
  /** Prefills the email field (e.g. from a collaborator invite link). */
  defaultEmail?: string
}

export function AuthForm({
  title,
  subtitle,
  submitLabel,
  action,
  passwordAutoComplete,
  footer,
  next,
  forgotHref,
  showName,
  defaultEmail,
}: AuthFormProps) {
  const t = useT()
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, undefined)
  const [showPassword, setShowPassword] = useState(false)
  const [accountType, setAccountType] = useState<'private' | 'pro'>('private')
  const isPro = accountType === 'pro'

  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 px-4 py-16 dark:from-slate-950 dark:to-indigo-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Brand />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{title}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>

          <form action={formAction} className="mt-6 space-y-4">
            {next && <input type="hidden" name="next" value={next} />}
            {showName && (
              <>
                <div className="space-y-1.5">
                  <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t('auth.accountType')}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { value: 'private', label: t('auth.private'), hint: t('auth.privateHint') },
                        { value: 'pro', label: t('auth.pro'), hint: t('auth.proHint') },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAccountType(opt.value)}
                        aria-pressed={accountType === opt.value}
                        className={`rounded-lg border px-3 py-2 text-left transition ${
                          accountType === opt.value
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-300'
                            : 'border-slate-300 text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:text-slate-400'
                        }`}
                      >
                        <span className="block text-sm font-medium">{opt.label}</span>
                        <span className="block text-xs opacity-70">{opt.hint}</span>
                      </button>
                    ))}
                  </div>
                  <input type="hidden" name="accountType" value={accountType} />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="displayName"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    {isPro ? t('auth.nameOrg') : t('auth.nameFull')}
                  </label>
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    autoComplete={isPro ? 'organization' : 'name'}
                    required
                    maxLength={120}
                    placeholder={isPro ? t('auth.namePlaceholderPro') : t('auth.namePlaceholderPrivate')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

                {isPro && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    {t('auth.proPending')}
                  </p>
                )}
              </>
            )}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                {t('auth.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                defaultValue={defaultEmail}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  {t('auth.password')}
                </label>
                {forgotHref && (
                  <Link
                    href={forgotHref}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                  >
                    {t('auth.forgot')}
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={passwordAutoComplete}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
                      <path
                        d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 4.2A9.8 9.8 0 0112 4c5 0 9 4.5 10 8-.3 1-1 2.2-1.9 3.3M6.1 6.1C4 7.4 2.6 9.4 2 12c1 3.5 5 8 10 8 1.6 0 3-.4 4.3-1"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
                      <path
                        d="M2 12c1-3.5 5-8 10-8s9 4.5 10 8c-1 3.5-5 8-10 8s-9-4.5-10-8z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {state?.error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300"
              >
                {state.error}
              </p>
            )}

            {state?.message && (
              <p
                role="status"
                className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
              >
                {state.message}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-slate-900"
            >
              {pending ? t('auth.pleaseWait') : submitLabel}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">{footer}</p>
      </div>
    </main>
  )
}
