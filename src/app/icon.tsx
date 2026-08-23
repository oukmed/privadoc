import { ImageResponse } from 'next/og'

// Browser-tab favicon: indigo rounded square with a white "P", matching the
// PWA icons (icon-192/512) and the Brand lockup.
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
          color: '#ffffff',
          fontSize: 22,
          fontWeight: 700,
          borderRadius: 7,
        }}
      >
        P
      </div>
    ),
    size,
  )
}
