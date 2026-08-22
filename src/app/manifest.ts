import type { MetadataRoute } from 'next'

/** Web app manifest — makes PrivaDoc installable (Android + iPhone), served at /manifest.webmanifest. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PrivaDoc',
    short_name: 'PrivaDoc',
    description: 'Votre coffre-fort de documents privé.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f8fafc',
    theme_color: '#4f46e5',
    lang: 'fr',
    icons: [
      { src: '/icon-192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
