import { createServerFn } from '@tanstack/react-start'

import {
  loadCollectionSnapshot,
  loadFeedSnapshot,
  loadFriendsSnapshot,
  loadMintSnapshot,
  loadMomentSnapshot,
  loadSettingsSnapshot,
  loadVaultSnapshot,
} from './app.server'
import { collectionParamsSchema, momentParamsSchema, vaultParamsSchema } from './schemas'

export const getFeedSnapshot = createServerFn({ method: 'GET' }).handler(
  async () => loadFeedSnapshot(),
)

export const getMintSnapshot = createServerFn({ method: 'GET' }).handler(
  async () => loadMintSnapshot(),
)

export const getVaultSnapshot = createServerFn({ method: 'GET' })
  .validator(vaultParamsSchema)
  .handler(async ({ data }) => loadVaultSnapshot(data))

export const getFriendsSnapshot = createServerFn({ method: 'GET' }).handler(
  async () => loadFriendsSnapshot(),
)

export const getSettingsSnapshot = createServerFn({ method: 'GET' }).handler(
  async () => loadSettingsSnapshot(),
)

export const getMomentSnapshot = createServerFn({ method: 'GET' })
  .validator(momentParamsSchema)
  .handler(async ({ data }) => loadMomentSnapshot(data))

export const getCollectionSnapshot = createServerFn({ method: 'GET' })
  .validator(collectionParamsSchema)
  .handler(async ({ data }) => loadCollectionSnapshot(data))
