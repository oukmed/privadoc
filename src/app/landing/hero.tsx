import Link from 'next/link'
import { ArrowIcon, BTN_PRIMARY, BTN_SECONDARY, CheckIcon, CONTAINER, Eyebrow } from '@/app/landing/ui'

type Item = { label: string; received: boolean }
const CHECKLIST: Item[] = [
  { label: "Pièce d'identité", received: true },
  { label: "Dernier avis d'imposition", received: true },
  { label: 'Justificatif de domicile', received: false },
  { label: 'RIB', received: false },
]

/** Hero: asymmetric, left-weighted. Copy on the left, one authentic product card on the right. */
export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className={`${CONTAINER} pt-16 pb-24 sm:pt-24`}>
      <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <div>
          <Eyebrow>Pour les avocats, notaires et experts-comptables</Eyebrow>
          <h1
            id="hero-heading"
            className="mt-5 font-serif text-4xl font-semibold leading-[1.02] tracking-tight text-balance text-slate-900 sm:text-6xl lg:text-[4.25rem] dark:text-white"
          >
            Récupérez chaque pièce du dossier.{' '}
            <span className="text-indigo-600 dark:text-indigo-400">Sans courir après personne.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-600 dark:text-slate-300">
            PrivaDoc dresse la liste des documents à fournir, votre client les dépose via un seul
            lien, et vous êtes prévenu à chaque réception. Vous suivez l&apos;avancement de chaque
            dossier d&apos;un coup d&apos;œil.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/signup" className={BTN_PRIMARY}>
              Créer un compte gratuit
              <ArrowIcon />
            </Link>
            <Link href="/login" className={BTN_SECONDARY}>
              Se connecter
            </Link>
            <Link
              href="#fonctionnement"
              className="text-sm font-medium text-slate-600 underline-offset-4 hover:underline dark:text-slate-300"
            >
              Voir comment ça marche
            </Link>
          </div>
          <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
            Gratuit pour démarrer · Sans carte bancaire · Hébergé en Europe
          </p>
        </div>

        <div className="lg:-mb-24" aria-hidden="true">
          <ProductCard />
        </div>
      </div>
    </section>
  )
}

/** The authentic "Demande de pièces" checklist + progress card (real product visual). */
function ProductCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md lg:-rotate-1 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <span className="grid size-7 place-items-center rounded-lg bg-indigo-600 text-white">
          <svg viewBox="0 0 24 24" fill="none" className="size-4">
            <path
              d="M7 3.75h6l4 4V19a1.25 1.25 0 0 1-1.25 1.25h-8.5A1.25 1.25 0 0 1 6 19V5A1.25 1.25 0 0 1 7 3.75Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="m9.4 13.6 1.9 1.9 3.4-3.6"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="text-sm font-semibold text-slate-900 dark:text-white">PrivaDoc</span>
        <span className="ml-auto rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
          Demande de pièces
        </span>
      </div>

      <ul className="mt-5 grid gap-2">
        {CHECKLIST.map((item, index) => (
          <li
            key={item.label}
            className="flex items-center gap-3 text-sm motion-safe:animate-[landing-pop_0.5s_ease-out_backwards]"
            style={{ animationDelay: `${0.15 + index * 0.12}s` }}
          >
            {item.received ? (
              <span className="grid size-5 shrink-0 place-items-center rounded-md border border-emerald-600 bg-emerald-600 text-white">
                <CheckIcon className="size-3.5" />
              </span>
            ) : (
              <span className="size-5 shrink-0 rounded-md border border-dashed border-slate-300 dark:border-slate-700" />
            )}
            <span className={item.received ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}>
              {item.label}
            </span>
            {item.received ? (
              <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                Reçu
              </span>
            ) : (
              <span className="ml-auto rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                En attente
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-5">
        <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-1.5 w-1/2 origin-left rounded-full bg-indigo-600 motion-safe:animate-[landing-grow_0.9s_cubic-bezier(0.16,1,0.3,1)_0.3s_backwards] dark:bg-indigo-400" />
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>2 pièces sur 4 reçues</span>
          <span>50 %</span>
        </div>
      </div>
    </div>
  )
}
