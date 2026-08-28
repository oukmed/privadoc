import type { ReactNode } from 'react'
import { AppHeader } from '@/app/app-header'
import { getProfile } from '@/app/account/profile'
import { ProNav } from '@/app/pro/pro-nav'

// Shell for the whole professional space. Renders the global header once and,
// for an approved pro, the section sidebar + content container. Non-pros (the
// onboarding / pending screen lives in page.tsx) get a plain centered column —
// the sibling pages redirect non-pros to /pro, so only the dashboard renders here
// without the sidebar.
export default async function ProLayout({ children }: { children: ReactNode }) {
  const { isProfessional } = await getProfile()

  return (
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
      <AppHeader />
      {isProfessional ? (
        <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-6 py-8">
          <aside className="hidden w-56 shrink-0 md:block">
            <div className="sticky top-20">
              <ProNav />
            </div>
          </aside>
          <div className="min-w-0 flex-1">
            <div className="mb-5 md:hidden">
              <ProNav />
            </div>
            {children}
          </div>
        </div>
      ) : (
        <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">{children}</main>
      )}
    </div>
  )
}
