interface BrandProps {
  /** Text size of the wordmark; the mark scales with it. */
  size?: 'sm' | 'md'
  className?: string
}

/**
 * PrivaDoc lockup: an indigo padlock mark + a two-tone wordmark.
 * Presentational only — safe in server components.
 */
export function Brand({ size = 'md', className = '' }: BrandProps) {
  const mark = size === 'sm' ? 'size-7' : 'size-8'
  const glyph = size === 'sm' ? 'size-4' : 'size-[18px]'
  const word = size === 'sm' ? 'text-base' : 'text-lg'

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        aria-hidden="true"
        className={`grid ${mark} place-items-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/30`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={glyph}>
          <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <rect x="5" y="10" width="14" height="11" rx="2.5" fill="currentColor" />
          <circle cx="12" cy="14.7" r="1.6" fill="#4f46e5" />
          <rect x="11.1" y="15.9" width="1.8" height="3" rx="0.5" fill="#4f46e5" />
        </svg>
      </span>
      <span className={`${word} font-bold tracking-tight text-slate-900 dark:text-white`}>
        Priva<span className="text-indigo-600 dark:text-indigo-400">Doc</span>
      </span>
    </span>
  )
}
