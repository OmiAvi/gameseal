import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core'
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

export const venues = sqliteTable(
  'venues',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    city: text('city').notNull(),
    region: text('region'),
    country: text('country').notNull().default('USA'),
    timezone: text('timezone').notNull().default('America/New_York'),
    latitude: real('latitude'),
    longitude: real('longitude'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    uniqueIndex('venues_slug_unique').on(table.slug),
    index('venues_city_region_idx').on(table.city, table.region),
  ],
)

export const teams = sqliteTable(
  'teams',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    shortName: text('short_name').notNull(),
    city: text('city').notNull(),
    league: text('league').notNull(),
    sport: text('sport').notNull().default('basketball'),
    primaryColor: text('primary_color'),
    secondaryColor: text('secondary_color'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    uniqueIndex('teams_slug_unique').on(table.slug),
    index('teams_league_city_idx').on(table.league, table.city),
  ],
)

export const user = sqliteTable(
  'user',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    emailVerified: integer('email_verified', { mode: 'boolean' })
      .notNull()
      .default(false),
    image: text('image'),
    username: text('username'),
    displayUsername: text('display_username'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    uniqueIndex('user_email_unique').on(table.email),
    uniqueIndex('user_username_unique').on(table.username),
  ],
)

export const session = sqliteTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    token: text('token').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('session_token_unique').on(table.token),
    index('session_user_id_idx').on(table.userId),
  ],
)

export const account = sqliteTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: integer('access_token_expires_at', {
      mode: 'timestamp_ms',
    }),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', {
      mode: 'timestamp_ms',
    }),
    scope: text('scope'),
    password: text('password'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    uniqueIndex('account_provider_account_unique').on(
      table.providerId,
      table.accountId,
    ),
    index('account_user_id_idx').on(table.userId),
  ],
)

export const verification = sqliteTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
)

export const profiles = sqliteTable(
  'profiles',
  {
    id: text('id').primaryKey(),
    authUserId: text('auth_user_id').references(() => user.id, {
      onDelete: 'cascade',
    }),
    username: text('username').notNull(),
    displayName: text('display_name').notNull(),
    bio: text('bio'),
    avatarMediaKey: text('avatar_media_key'),
    favoriteTeamId: text('favorite_team_id').references(() => teams.id, {
      onDelete: 'set null',
    }),
    homeVenueId: text('home_venue_id').references(() => venues.id, {
      onDelete: 'set null',
    }),
    isPrivate: integer('is_private', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    uniqueIndex('profiles_auth_user_unique').on(table.authUserId),
    uniqueIndex('profiles_username_unique').on(table.username),
    index('profiles_home_venue_idx').on(table.homeVenueId),
    index('profiles_favorite_team_idx').on(table.favoriteTeamId),
  ],
)

export const games = sqliteTable(
  'games',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    externalId: text('external_id'),
    homeTeamId: text('home_team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'restrict' }),
    awayTeamId: text('away_team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'restrict' }),
    venueId: text('venue_id')
      .notNull()
      .references(() => venues.id, { onDelete: 'restrict' }),
    status: text('status', {
      enum: ['scheduled', 'live', 'final', 'postponed', 'cancelled'],
    })
      .notNull()
      .default('scheduled'),
    startsAt: integer('starts_at', { mode: 'timestamp_ms' }).notNull(),
    seasonLabel: text('season_label'),
    weekLabel: text('week_label'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    uniqueIndex('games_slug_unique').on(table.slug),
    uniqueIndex('games_external_id_unique').on(table.externalId),
    index('games_feed_idx').on(table.startsAt, table.status),
    index('games_venue_idx').on(table.venueId, table.startsAt),
  ],
)

export const cardTemplates = sqliteTable(
  'card_templates',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    themeName: text('theme_name').notNull(),
    accentColor: text('accent_color'),
    foilStyle: text('foil_style'),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    uniqueIndex('card_templates_slug_unique').on(table.slug),
    index('card_templates_active_idx').on(table.isActive, table.name),
  ],
)

export const moments = sqliteTable(
  'moments',
  {
    id: text('id').primaryKey(),
    creatorProfileId: text('creator_profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    gameId: text('game_id').references(() => games.id, { onDelete: 'set null' }),
    venueId: text('venue_id').references(() => venues.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    caption: text('caption'),
    matchup: text('matchup').notNull().default('Matchup pending'),
    finalScore: text('final_score').notNull().default('Score pending'),
    section: text('section'),
    row: text('row'),
    seat: text('seat'),
    memoryRating: integer('memory_rating').notNull().default(7),
    visibility: text('visibility', {
      enum: ['public', 'friends', 'private'],
    })
      .notNull()
      .default('public'),
    status: text('status', {
      enum: ['draft', 'processing', 'published', 'archived'],
    })
      .notNull()
      .default('draft'),
    capturedAt: integer('captured_at', { mode: 'timestamp_ms' }),
    publishedAt: integer('published_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('moments_feed_idx').on(
      table.visibility,
      table.status,
      table.publishedAt,
      table.createdAt,
    ),
    index('moments_profile_idx').on(table.creatorProfileId, table.createdAt),
    index('moments_game_idx').on(table.gameId, table.createdAt),
    index('moments_venue_idx').on(table.venueId, table.createdAt),
  ],
)

export const momentMedia = sqliteTable(
  'moment_media',
  {
    id: text('id').primaryKey(),
    momentId: text('moment_id')
      .notNull()
      .references(() => moments.id, { onDelete: 'cascade' }),
    mediaType: text('media_type', {
      enum: ['image', 'video', 'thumbnail'],
    }).notNull(),
    storageKey: text('storage_key').notNull(),
    mimeType: text('mime_type'),
    width: integer('width'),
    height: integer('height'),
    durationMs: integer('duration_ms'),
    sortOrder: integer('sort_order').notNull().default(0),
    blurhash: text('blurhash'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    uniqueIndex('moment_media_storage_key_unique').on(table.storageKey),
    index('moment_media_moment_sort_idx').on(table.momentId, table.sortOrder),
  ],
)

export const momentCards = sqliteTable(
  'moment_cards',
  {
    id: text('id').primaryKey(),
    momentId: text('moment_id')
      .notNull()
      .references(() => moments.id, { onDelete: 'cascade' }),
    ownerProfileId: text('owner_profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    templateId: text('template_id')
      .notNull()
      .references(() => cardTemplates.id, { onDelete: 'restrict' }),
    serialNumber: integer('serial_number').notNull().default(1),
    editionSize: integer('edition_size').notNull().default(1),
    mintedAt: integer('minted_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    uniqueIndex('moment_cards_moment_unique').on(table.momentId),
    index('moment_cards_profile_idx').on(table.ownerProfileId, table.mintedAt),
    index('moment_cards_template_idx').on(table.templateId, table.mintedAt),
  ],
)

export const collections = sqliteTable(
  'collections',
  {
    id: text('id').primaryKey(),
    ownerProfileId: text('owner_profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    visibility: text('visibility', {
      enum: ['public', 'friends', 'private'],
    })
      .notNull()
      .default('public'),
    coverMomentId: text('cover_moment_id').references(() => moments.id, {
      onDelete: 'set null',
    }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    uniqueIndex('collections_owner_slug_unique').on(table.ownerProfileId, table.slug),
    index('collections_profile_idx').on(table.ownerProfileId, table.updatedAt),
    index('collections_visibility_idx').on(table.visibility, table.updatedAt),
  ],
)

export const collectionMoments = sqliteTable(
  'collection_moments',
  {
    collectionId: text('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    momentId: text('moment_id')
      .notNull()
      .references(() => moments.id, { onDelete: 'cascade' }),
    addedByProfileId: text('added_by_profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.collectionId, table.momentId] }),
    index('collection_moments_collection_idx').on(table.collectionId, table.position),
    index('collection_moments_profile_idx').on(table.addedByProfileId, table.createdAt),
  ],
)

export const friendRequests = sqliteTable(
  'friend_requests',
  {
    id: text('id').primaryKey(),
    senderProfileId: text('sender_profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    receiverProfileId: text('receiver_profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    status: text('status', {
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    })
      .notNull()
      .default('pending'),
    message: text('message'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    respondedAt: integer('responded_at', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('friend_requests_receiver_idx').on(
      table.receiverProfileId,
      table.status,
      table.createdAt,
    ),
    index('friend_requests_sender_idx').on(
      table.senderProfileId,
      table.status,
      table.createdAt,
    ),
  ],
)

export const friendships = sqliteTable(
  'friendships',
  {
    id: text('id').primaryKey(),
    profileId: text('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    friendProfileId: text('friend_profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    sourceRequestId: text('source_request_id').references(() => friendRequests.id, {
      onDelete: 'set null',
    }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    uniqueIndex('friendships_pair_unique').on(table.profileId, table.friendProfileId),
    index('friendships_profile_idx').on(table.profileId, table.createdAt),
    index('friendships_friend_idx').on(table.friendProfileId, table.createdAt),
  ],
)

export const blocks = sqliteTable(
  'blocks',
  {
    id: text('id').primaryKey(),
    blockerProfileId: text('blocker_profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    blockedProfileId: text('blocked_profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    reason: text('reason'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    uniqueIndex('blocks_pair_unique').on(table.blockerProfileId, table.blockedProfileId),
    index('blocks_blocker_idx').on(table.blockerProfileId, table.createdAt),
  ],
)

export const momentReactions = sqliteTable(
  'moment_reactions',
  {
    id: text('id').primaryKey(),
    momentId: text('moment_id')
      .notNull()
      .references(() => moments.id, { onDelete: 'cascade' }),
    profileId: text('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    reactionType: text('reaction_type', {
      enum: ['fire', 'ice', 'cheer', 'wow'],
    }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    uniqueIndex('moment_reactions_unique').on(
      table.momentId,
      table.profileId,
      table.reactionType,
    ),
    index('moment_reactions_feed_idx').on(table.momentId, table.createdAt),
    index('moment_reactions_profile_idx').on(table.profileId, table.createdAt),
  ],
)

export const momentComments = sqliteTable(
  'moment_comments',
  {
    id: text('id').primaryKey(),
    momentId: text('moment_id')
      .notNull()
      .references(() => moments.id, { onDelete: 'cascade' }),
    profileId: text('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    parentCommentId: text('parent_comment_id').references((): AnySQLiteColumn => momentComments.id, {
      onDelete: 'cascade',
    }),
    body: text('body').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('moment_comments_feed_idx').on(table.momentId, table.createdAt),
    index('moment_comments_profile_idx').on(table.profileId, table.createdAt),
    index('moment_comments_parent_idx').on(table.parentCommentId, table.createdAt),
  ],
)

export const gameAttendees = sqliteTable(
  'game_attendees',
  {
    id: text('id').primaryKey(),
    gameId: text('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    profileId: text('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    status: text('status', {
      enum: ['going', 'interested', 'checked_in'],
    })
      .notNull()
      .default('interested'),
    checkedInAt: integer('checked_in_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    uniqueIndex('game_attendees_unique').on(table.gameId, table.profileId),
    index('game_attendees_game_idx').on(table.gameId, table.status, table.createdAt),
    index('game_attendees_profile_idx').on(table.profileId, table.createdAt),
  ],
)

export const tags = sqliteTable(
  'tags',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    label: text('label').notNull(),
    category: text('category'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [uniqueIndex('tags_slug_unique').on(table.slug)],
)

export const momentTags = sqliteTable(
  'moment_tags',
  {
    momentId: text('moment_id')
      .notNull()
      .references(() => moments.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.momentId, table.tagId] }),
    index('moment_tags_tag_idx').on(table.tagId, table.createdAt),
  ],
)

export const companions = sqliteTable(
  'companions',
  {
    id: text('id').primaryKey(),
    momentId: text('moment_id')
      .notNull()
      .references(() => moments.id, { onDelete: 'cascade' }),
    profileId: text('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    companionProfileId: text('companion_profile_id').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    displayName: text('display_name'),
    role: text('role', {
      enum: ['photographer', 'collector', 'friend', 'family', 'fan'],
    }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    index('companions_moment_idx').on(table.momentId, table.createdAt),
    index('companions_profile_idx').on(table.profileId, table.createdAt),
  ],
)

export type VenueRecord = typeof venues.$inferSelect
export type NewVenueRecord = typeof venues.$inferInsert
export type TeamRecord = typeof teams.$inferSelect
export type NewTeamRecord = typeof teams.$inferInsert
export type AuthUserRecord = typeof user.$inferSelect
export type NewAuthUserRecord = typeof user.$inferInsert
export type AuthSessionRecord = typeof session.$inferSelect
export type NewAuthSessionRecord = typeof session.$inferInsert
export type AuthAccountRecord = typeof account.$inferSelect
export type NewAuthAccountRecord = typeof account.$inferInsert
export type AuthVerificationRecord = typeof verification.$inferSelect
export type NewAuthVerificationRecord = typeof verification.$inferInsert
export type ProfileRecord = typeof profiles.$inferSelect
export type NewProfileRecord = typeof profiles.$inferInsert
export type GameRecord = typeof games.$inferSelect
export type NewGameRecord = typeof games.$inferInsert
export type CardTemplateRecord = typeof cardTemplates.$inferSelect
export type NewCardTemplateRecord = typeof cardTemplates.$inferInsert
export type MomentRecord = typeof moments.$inferSelect
export type NewMomentRecord = typeof moments.$inferInsert
export type MomentMediaRecord = typeof momentMedia.$inferSelect
export type NewMomentMediaRecord = typeof momentMedia.$inferInsert
export type MomentCardRecord = typeof momentCards.$inferSelect
export type NewMomentCardRecord = typeof momentCards.$inferInsert
export type CollectionRecord = typeof collections.$inferSelect
export type NewCollectionRecord = typeof collections.$inferInsert
export type FriendRequestRecord = typeof friendRequests.$inferSelect
export type NewFriendRequestRecord = typeof friendRequests.$inferInsert
export type FriendshipRecord = typeof friendships.$inferSelect
export type NewFriendshipRecord = typeof friendships.$inferInsert
export type BlockRecord = typeof blocks.$inferSelect
export type NewBlockRecord = typeof blocks.$inferInsert
export type MomentReactionRecord = typeof momentReactions.$inferSelect
export type NewMomentReactionRecord = typeof momentReactions.$inferInsert
export type MomentCommentRecord = typeof momentComments.$inferSelect
export type NewMomentCommentRecord = typeof momentComments.$inferInsert
export type GameAttendeeRecord = typeof gameAttendees.$inferSelect
export type NewGameAttendeeRecord = typeof gameAttendees.$inferInsert
export type TagRecord = typeof tags.$inferSelect
export type NewTagRecord = typeof tags.$inferInsert
export type CompanionRecord = typeof companions.$inferSelect
export type NewCompanionRecord = typeof companions.$inferInsert
