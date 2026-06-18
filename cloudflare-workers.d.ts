declare module 'cloudflare:workers' {
  import type { AppBindings } from '#/lib/cloudflare'

  export const env: AppBindings
}
