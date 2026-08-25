import { ImageResponse } from 'next/og'

// Browser-tab favicon: indigo rounded square with the document+check glyph,
// matching the PWA icons (icon-192/512) and the Brand lockup.
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#4f46e5',
          borderRadius: 7,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M7 3.75h6l4 4V19a1.25 1.25 0 0 1-1.25 1.25h-8.5A1.25 1.25 0 0 1 6 19V5A1.25 1.25 0 0 1 7 3.75Z"
            stroke="#fff"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M13 3.75V8h4" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
          <path
            d="m9.4 13.6 1.9 1.9 3.4-3.6"
            stroke="#fff"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    size,
  )
}
