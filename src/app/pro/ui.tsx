// The pro space's UI primitives were promoted to the shared platform module so
// the private client space can reuse the same design system. Kept as a re-export
// so existing `@/app/pro/ui` imports keep working.
export * from '@/app/platform-ui'
