interface BrandProps {
  /** Text size of the wordmark; the mark scales with it. */
  size?: 'sm' | 'md'
  className?: string
}

/**
 * PrivaDoc lockup: an indigo document-with-check mark + a two-tone wordmark.
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
          <path
            d="M7 3.75h6l4 4V19a1.25 1.25 0 0 1-1.25 1.25h-8.5A1.25 1.25 0 0 1 6 19V5A1.25 1.25 0 0 1 7 3.75Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M13 3.75V8h4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path
            d="m9.4 13.6 1.9 1.9 3.4-3.6"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className={`${word} font-bold tracking-tight text-slate-900 dark:text-white`}>
        Priva<span className="text-indigo-600 dark:text-indigo-400">Doc</span>
      </span>
    </span>
  )
}
