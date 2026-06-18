import { drizzle } from 'drizzle-orm/d1'

import * as schema from './schema'

export type D1Client = Parameters<typeof drizzle>[0]

export function createDb(client: D1Client) {
  return drizzle(client, { schema })
}
