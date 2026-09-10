// Which content types are safe to render INLINE in a browser. A browser renders a
// file using the content-type stored on the object, which the uploader controls —
// so an inline preview must be gated to types that DISPLAY without executing any
// injected script. text/html and image/svg+xml are deliberately absent (they run
// script); anything not listed here is served as a download instead.
const PREVIEWABLE_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/avif',
])

/** True only for types safe to open inline (pdf, common raster images). Decide this
 * from the object's ACTUAL stored content-type (Storage `info()`), never from a
 * client-supplied value. */
export function isPreviewableType(contentType: string | null | undefined): boolean {
  return Boolean(contentType) && PREVIEWABLE_TYPES.has(contentType!.toLowerCase())
}
