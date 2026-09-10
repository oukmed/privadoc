import 'server-only'
import { isPreviewableType } from '@/lib/content-type'

// Minimal structural view of a Supabase Storage file API (bucket-scoped), so this
// helper stays decoupled from the exact client type.
interface ViewerStorage {
  info(path: string): Promise<{ data: { contentType?: string } | null }>
  createSignedUrl(
    path: string,
    expiresIn: number,
    options?: { download?: boolean | string },
  ): Promise<{ data: { signedUrl: string } | null }>
}

/**
 * Signed URL to hand to someone OTHER than the file's uploader. Offers an inline
 * URL only when the object's ACTUAL stored content-type is safe to render (pdf /
 * common raster images); everything else (incl. text/html, image/svg+xml) is a
 * forced download, so a spoofed content-type can't execute in the viewer's browser.
 * Returns null when the object is unavailable.
 */
export async function signedUrlForViewer(
  storage: ViewerStorage,
  path: string,
  expiresIn: number,
): Promise<string | null> {
  const { data: info } = await storage.info(path)
  const options = isPreviewableType(info?.contentType) ? undefined : { download: true }
  const { data } = await storage.createSignedUrl(path, expiresIn, options)
  return data?.signedUrl ?? null
}
