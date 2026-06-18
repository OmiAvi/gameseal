import type { CollectionParams, MomentParams, VaultParams } from './schemas'

import { loadCollectionDetailSnapshot } from '#/server/collections.server'
import {
  loadMintComposerSnapshot,
  loadMomentDetailSnapshot,
  loadVaultSnapshotFromUsername,
} from '#/server/moments.server'
import {
  loadFriendFeedSnapshot,
  loadFriendsSnapshotForViewer,
} from '#/server/social.server'

export async function loadFeedSnapshot() {
  return loadFriendFeedSnapshot()
}

export async function loadMintSnapshot() {
  return loadMintComposerSnapshot()
}

export async function loadVaultSnapshot({ username }: VaultParams) {
  return loadVaultSnapshotFromUsername({ username })
}

export async function loadFriendsSnapshot() {
  return loadFriendsSnapshotForViewer()
}

export async function loadSettingsSnapshot() {
  return {
    storageSummary: {
      mediaBucket: 'MOMENT_MEDIA',
      metadataDatabase: 'DB',
    },
  }
}

export async function loadMomentSnapshot({ momentId }: MomentParams) {
  return loadMomentDetailSnapshot(momentId)
}

export async function loadCollectionSnapshot({ collectionId }: CollectionParams) {
  return loadCollectionDetailSnapshot({ collectionId })
}
