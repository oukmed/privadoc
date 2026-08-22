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
          color: '#ffffff',
          fontSize: 300,
          fontWeight: 700,
        }}
      >
        P
      </div>
    ),
    { width: 512, height: 512 },
  )
}
