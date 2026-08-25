import { ImageResponse } from 'next/og'

// PWA icon (512px, purpose "maskable"): full-bleed indigo square, white "P"
// centered within the safe zone (the OS masks the corners).
export function GET() {
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
        }}
      >
        <svg width="288" height="288" viewBox="0 0 24 24" fill="none">
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
    { width: 512, height: 512 },
  )
}
