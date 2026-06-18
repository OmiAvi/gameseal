import type { D1Client } from '#/db/client'

export interface MomentMediaBucket {
  get: (key: string) => Promise<{
    arrayBuffer: () => Promise<ArrayBuffer>
    body?: ReadableStream | null
    httpMetadata?: {
      contentType?: string
    }
  } | null>
  put: (
    key: string,
    value: ArrayBuffer | ArrayBufferView | string | ReadableStream,
    options?: {
      httpMetadata?: {
        contentType?: string
      }
    },
  ) => Promise<unknown>
  delete?: (key: string) => Promise<void>
}

export interface AppBindings {
  DB: D1Client
  MOMENT_MEDIA: MomentMediaBucket
  BETTER_AUTH_SECRET?: string
}
