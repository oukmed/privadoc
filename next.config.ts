import type { NextConfig } from "next";

// Security headers applied to every route. The CSP is deliberately permissive on
// script/style ('unsafe-inline') because Next.js injects inline hydration scripts
// without a nonce; it still locks the high-value vectors (framing, base-uri,
// object/form-action) and constrains network egress to self + Supabase.
// ponytail: tighten script-src with per-request nonces later if needed.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: CSP },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // camera=(self): needed for the mobile document scanner (<input capture>); without
  // it some mobile browsers hide the camera option from the file picker entirely.
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Uploads (documents, collaborator write-back) go up to 20 MB; default is 1 MB.
      bodySizeLimit: '25mb',
    },
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
};

export default nextConfig;
