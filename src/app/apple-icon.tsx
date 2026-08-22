import { ImageResponse } from 'next/og'

// Apple touch icon (iOS home-screen). Next auto-injects the <link rel="apple-touch-icon">.
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
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
          fontSize: 120,
          fontWeight: 700,
        }}
      >
        P
      </div>
    ),
    { ...size },
  )
}
