import { ImageResponse } from 'next/og'

// PWA icon (192px, purpose "any"): indigo rounded square with a white "P".
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
          fontSize: 128,
          fontWeight: 700,
          borderRadius: 40,
        }}
      >
        P
      </div>
    ),
    { width: 192, height: 192 },
  )
}
