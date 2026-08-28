import type { ReactNode } from 'react'
import { AppHeader } from '@/app/app-header'
import { ClientNav } from '@/app/client-nav'

// Shell for the private client platform: the global header once, a section
// sidebar (desktop rail / mobile strip), and the content column. Every
// authenticated client page wraps its inner content in this instead of
// rendering its own header + background wrapper.
export function ClientShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
      <AppHeader />
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-6 py-8">
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-20">
            <ClientNav />
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <div className="mb-5 md:hidden">
            <ClientNav />
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
