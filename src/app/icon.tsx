import { ImageResponse } from 'next/og'

// Browser-tab favicon: indigo rounded square with the padlock glyph,
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
          <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          <rect x="5" y="10" width="14" height="11" rx="2.5" fill="#fff" />
          <circle cx="12" cy="14.7" r="1.6" fill="#4f46e5" />
          <rect x="11.1" y="15.9" width="1.8" height="3" rx="0.5" fill="#4f46e5" />
        </svg>
      </div>
    ),
    size,
  )
}
