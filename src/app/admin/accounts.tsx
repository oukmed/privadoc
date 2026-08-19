'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { activateSubscription, deactivateSubscription, revokePro } from '@/app/admin/actions'

const FREE_CLIENT_LIMIT = 5
const MONTHLY_PRICE_EUR = 35

export interface ProItem {
  id: string
  name: string
  email: string
  profession: string
  activeClients: number
  totalRequests: number
  subscribed: boolean
  createdAt: string
}

export interface ClientItem {
  id: string
  name: string | null
  email: string
  requestsReceived: number
  createdAt: string
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR')
}

function Initial({ label }: { label: string }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
      {label.charAt(0).toUpperCase()}
    </span>
  )
}

export function AdminAccounts({ pros, clients }: { pros: ProItem[]; clients: ClientItem[] }) {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'pros' | 'clients'>('pros')

  const q = query.trim().toLowerCase()
  const filteredPros = useMemo(
    () =>
      q
        ? pros.filter((p) =>
            [p.name, p.email, p.profession].some((v) => v.toLowerCase().includes(q)),
          )
        : pros,
    [pros, q],
  )
  const filteredClients = useMemo(
    () =>
      q
        ? clients.filter((c) => [c.name ?? '', c.email].some((v) => v.toLowerCase().includes(q)))
        : clients,
    [clients, q],
  )

  const tabClass = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
      active
        ? 'bg-indigo-600 text-white'
        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
    }`

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          <button type="button" onClick={() => setTab('pros')} className={tabClass(tab === 'pros')}>
            Professionnels ({pros.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('clients')}
            className={tabClass(tab === 'clients')}
          >
            Clients ({clients.length})
          </button>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un nom, email…"
          className="w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        />
      </div>

      {tab === 'pros' ? (
        <ul className="mt-4 flex flex-col gap-3">
          {filteredPros.length === 0 && (
            <li className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              Aucun professionnel.
            </li>
          )}
          {filteredPros.map((p) => {
            const needsPayment = p.activeClients > FREE_CLIENT_LIMIT && !p.subscribed
            return (
              <li
                key={p.id}
                className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Initial label={p.name || p.email} />
                    <div className="min-w-0">
                      <Link
                        href={`/admin/${p.id}`}
                        className="font-medium text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
                      >
                        {p.name || 'Sans nom'}
                      </Link>
                      <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
                        {p.email} · {p.profession}
                      </p>
                      <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {p.activeClients}/{FREE_CLIENT_LIMIT} clients
                        </span>
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {p.totalRequests} demande{p.totalRequests > 1 ? 's' : ''}
                        </span>
                        <span
                          className={
                            p.subscribed
                              ? 'inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : 'inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }
                        >
                          {p.subscribed ? 'Abonnement actif' : 'Gratuit'}
                        </span>
                        {needsPayment && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                            Abonnement requis ({MONTHLY_PRICE_EUR} €/mois)
                          </span>
                        )}
                        <span className="text-slate-400 dark:text-slate-500">
                          Depuis le {fmtDate(p.createdAt)}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                      href={`/admin/${p.id}`}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Détails
                    </Link>
                    <form action={p.subscribed ? deactivateSubscription : activateSubscription}>
                      <input type="hidden" name="profileId" value={p.id} />
                      <button
                        type="submit"
                        className={
                          p.subscribed
                            ? 'rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                            : 'rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500'
                        }
                      >
                        {p.subscribed ? 'Désactiver' : 'Abonnement'}
                      </button>
                    </form>
                    <form action={revokePro}>
                      <input type="hidden" name="profileId" value={p.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
                      >
                        Rétrograder
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {filteredClients.length === 0 && (
            <li className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              Aucun client.
            </li>
          )}
          {filteredClients.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Initial label={c.name || c.email} />
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {c.name || c.email}
                  </p>
                  {c.name && (
                    <p className="truncate text-sm text-slate-500 dark:text-slate-400">{c.email}</p>
                  )}
                  <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                    Inscrit le {fmtDate(c.createdAt)}
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {c.requestsReceived} demande{c.requestsReceived > 1 ? 's' : ''} reçue
                {c.requestsReceived > 1 ? 's' : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
