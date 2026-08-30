import { CONTAINER, SectionHead, WarmBand } from '@/app/landing/ui'
import { getT } from '@/lib/i18n/server'

type Row = { criterion: string; privadoc: string; drive: string }

const ROW_KEYS = [
  { criterion: 'landing.comparison.r1.criterion', privadoc: 'landing.comparison.r1.privadoc', drive: null },
  {
    criterion: 'landing.comparison.r2.criterion',
    privadoc: 'landing.comparison.r2.privadoc',
    drive: 'landing.comparison.r2.drive',
  },
  {
    criterion: 'landing.comparison.r3.criterion',
    privadoc: 'landing.comparison.r3.privadoc',
    drive: 'landing.comparison.r3.drive',
  },
  {
    criterion: 'landing.comparison.r4.criterion',
    privadoc: 'landing.comparison.r4.privadoc',
    drive: 'landing.comparison.r4.drive',
  },
  {
    criterion: 'landing.comparison.r5.criterion',
    privadoc: 'landing.comparison.r5.privadoc',
    drive: 'landing.comparison.r5.drive',
  },
] as const

/** Comparison, demoted to compact monochrome evidence: a real semantic table, 5 rows. */
export async function Comparison() {
  const t = await getT()
  const rows: Row[] = ROW_KEYS.map(({ criterion, privadoc, drive }) => ({
    criterion: t(criterion),
    privadoc: t(privadoc),
    drive: drive ? t(drive) : '—',
  }))

  return (
    <WarmBand>
      <section id="comparatif" aria-labelledby="comparatif-heading" className={`${CONTAINER} py-20 sm:py-28`}>
        <SectionHead
          index="05"
          eyebrow={t('landing.comparison.eyebrow')}
          title={t('landing.comparison.title')}
          headingId="comparatif-heading"
          subtitle={t('landing.comparison.subtitle')}
        />
        <div
          role="region"
          aria-label={t('landing.comparison.regionAria')}
          tabIndex={0}
          className="mt-10 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
        >
          <table className="w-full min-w-140 border-collapse text-left">
            <caption className="sr-only">{t('landing.comparison.caption')}</caption>
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th scope="col" className="px-5 py-3.5 text-sm font-semibold" />
                <th
                  scope="col"
                  className="border-l-2 border-indigo-600 px-5 py-3.5 text-sm font-semibold text-slate-900 dark:text-white"
                >
                  PrivaDoc
                </th>
                <th scope="col" className="px-5 py-3.5 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Google Drive
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row.criterion}
                  className={index < rows.length - 1 ? 'border-b border-slate-200 dark:border-slate-800' : ''}
                >
                  <th scope="row" className="w-[38%] px-5 py-3.5 font-medium text-slate-900 dark:text-white">
                    {row.criterion}
                  </th>
                  <td className="border-l-2 border-indigo-600 px-5 py-3.5 font-medium text-slate-800 dark:text-slate-100">
                    {row.privadoc}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                    {row.drive === '—' ? (
                      <>
                        <span aria-hidden="true">—</span>
                        <span className="sr-only">{t('landing.comparison.no')}</span>
                      </>
                    ) : (
                      row.drive
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </WarmBand>
  )
}
