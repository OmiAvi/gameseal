CREATE TABLE `blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`blocker_profile_id` text NOT NULL,
	`blocked_profile_id` text NOT NULL,
	`reason` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`blocker_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`blocked_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `blocks_pair_unique` ON `blocks` (`blocker_profile_id`,`blocked_profile_id`);--> statement-breakpoint
CREATE INDEX `blocks_blocker_idx` ON `blocks` (`blocker_profile_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `card_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`theme_name` text NOT NULL,
	`accent_color` text,
	`foil_style` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `card_templates_slug_unique` ON `card_templates` (`slug`);--> statement-breakpoint
CREATE INDEX `card_templates_active_idx` ON `card_templates` (`is_active`,`name`);--> statement-breakpoint
CREATE TABLE `collection_moments` (
	`collection_id` text NOT NULL,
	`moment_id` text NOT NULL,
	`added_by_profile_id` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`collection_id`, `moment_id`),
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`moment_id`) REFERENCES `moments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`added_by_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `collection_moments_collection_idx` ON `collection_moments` (`collection_id`,`position`);--> statement-breakpoint
CREATE INDEX `collection_moments_profile_idx` ON `collection_moments` (`added_by_profile_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `collections` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_profile_id` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`visibility` text DEFAULT 'public' NOT NULL,
	`cover_moment_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cover_moment_id`) REFERENCES `moments`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collections_owner_slug_unique` ON `collections` (`owner_profile_id`,`slug`);--> statement-breakpoint
CREATE INDEX `collections_profile_idx` ON `collections` (`owner_profile_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `collections_visibility_idx` ON `collections` (`visibility`,`updated_at`);--> statement-breakpoint
CREATE TABLE `companions` (
	`id` text PRIMARY KEY NOT NULL,
	`moment_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`companion_profile_id` text,
	`display_name` text,
	`role` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`moment_id`) REFERENCES `moments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`companion_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `companions_moment_idx` ON `companions` (`moment_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `companions_profile_idx` ON `companions` (`profile_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `friend_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`sender_profile_id` text NOT NULL,
	`receiver_profile_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`message` text,
	`created_at` integer NOT NULL,
	`responded_at` integer,
	FOREIGN KEY (`sender_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`receiver_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `friend_requests_receiver_idx` ON `friend_requests` (`receiver_profile_id`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `friend_requests_sender_idx` ON `friend_requests` (`sender_profile_id`,`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `friendships` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`friend_profile_id` text NOT NULL,
	`source_request_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`friend_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_request_id`) REFERENCES `friend_requests`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `friendships_pair_unique` ON `friendships` (`profile_id`,`friend_profile_id`);--> statement-breakpoint
CREATE INDEX `friendships_profile_idx` ON `friendships` (`profile_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `friendships_friend_idx` ON `friendships` (`friend_profile_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `game_attendees` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`status` text DEFAULT 'interested' NOT NULL,
	`checked_in_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_attendees_unique` ON `game_attendees` (`game_id`,`profile_id`);--> statement-breakpoint
CREATE INDEX `game_attendees_game_idx` ON `game_attendees` (`game_id`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `game_attendees_profile_idx` ON `game_attendees` (`profile_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `games` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`external_id` text,
	`home_team_id` text NOT NULL,
	`away_team_id` text NOT NULL,
	`venue_id` text NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`starts_at` integer NOT NULL,
	`season_label` text,
	`week_label` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`home_team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`away_team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `games_slug_unique` ON `games` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `games_external_id_unique` ON `games` (`external_id`);--> statement-breakpoint
CREATE INDEX `games_feed_idx` ON `games` (`starts_at`,`status`);--> statement-breakpoint
CREATE INDEX `games_venue_idx` ON `games` (`venue_id`,`starts_at`);--> statement-breakpoint
CREATE TABLE `moment_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`moment_id` text NOT NULL,
	`owner_profile_id` text NOT NULL,
	`template_id` text NOT NULL,
	`serial_number` integer DEFAULT 1 NOT NULL,
	`edition_size` integer DEFAULT 1 NOT NULL,
	`minted_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`moment_id`) REFERENCES `moments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`template_id`) REFERENCES `card_templates`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `moment_cards_moment_unique` ON `moment_cards` (`moment_id`);--> statement-breakpoint
CREATE INDEX `moment_cards_profile_idx` ON `moment_cards` (`owner_profile_id`,`minted_at`);--> statement-breakpoint
CREATE INDEX `moment_cards_template_idx` ON `moment_cards` (`template_id`,`minted_at`);--> statement-breakpoint
CREATE TABLE `moment_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`moment_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`parent_comment_id` text,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`moment_id`) REFERENCES `moments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_comment_id`) REFERENCES `moment_comments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `moment_comments_feed_idx` ON `moment_comments` (`moment_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `moment_comments_profile_idx` ON `moment_comments` (`profile_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `moment_comments_parent_idx` ON `moment_comments` (`parent_comment_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `moment_media` (
	`id` text PRIMARY KEY NOT NULL,
	`moment_id` text NOT NULL,
	`media_type` text NOT NULL,
	`storage_key` text NOT NULL,
	`mime_type` text,
	`width` integer,
	`height` integer,
	`duration_ms` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`blurhash` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`moment_id`) REFERENCES `moments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `moment_media_storage_key_unique` ON `moment_media` (`storage_key`);--> statement-breakpoint
CREATE INDEX `moment_media_moment_sort_idx` ON `moment_media` (`moment_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `moment_reactions` (
	`id` text PRIMARY KEY NOT NULL,
	`moment_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`reaction_type` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`moment_id`) REFERENCES `moments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `moment_reactions_unique` ON `moment_reactions` (`moment_id`,`profile_id`,`reaction_type`);--> statement-breakpoint
CREATE INDEX `moment_reactions_feed_idx` ON `moment_reactions` (`moment_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `moment_reactions_profile_idx` ON `moment_reactions` (`profile_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `moment_tags` (
	`moment_id` text NOT NULL,
	`tag_id` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`moment_id`, `tag_id`),
	FOREIGN KEY (`moment_id`) REFERENCES `moments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `moment_tags_tag_idx` ON `moment_tags` (`tag_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `moments` (
	`id` text PRIMARY KEY NOT NULL,
	`creator_profile_id` text NOT NULL,
	`game_id` text,
	`venue_id` text,
	`title` text NOT NULL,
	`caption` text,
	`visibility` text DEFAULT 'public' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`captured_at` integer,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`creator_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `moments_feed_idx` ON `moments` (`visibility`,`status`,`published_at`,`created_at`);--> statement-breakpoint
CREATE INDEX `moments_profile_idx` ON `moments` (`creator_profile_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `moments_game_idx` ON `moments` (`game_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `moments_venue_idx` ON `moments` (`venue_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`display_name` text NOT NULL,
	`bio` text,
	`avatar_media_key` text,
	`favorite_team_id` text,
	`home_venue_id` text,
	`is_private` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`favorite_team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`home_venue_id`) REFERENCES `venues`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_username_unique` ON `profiles` (`username`);--> statement-breakpoint
CREATE INDEX `profiles_home_venue_idx` ON `profiles` (`home_venue_id`);--> statement-breakpoint
CREATE INDEX `profiles_favorite_team_idx` ON `profiles` (`favorite_team_id`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`label` text NOT NULL,
	`category` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_slug_unique` ON `tags` (`slug`);--> statement-breakpoint
CREATE TABLE `teams` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`short_name` text NOT NULL,
	`city` text NOT NULL,
	`league` text NOT NULL,
	`sport` text DEFAULT 'basketball' NOT NULL,
	`primary_color` text,
	`secondary_color` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teams_slug_unique` ON `teams` (`slug`);--> statement-breakpoint
CREATE INDEX `teams_league_city_idx` ON `teams` (`league`,`city`);--> statement-breakpoint
CREATE TABLE `venues` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`city` text NOT NULL,
	`region` text,
	`country` text DEFAULT 'USA' NOT NULL,
	`timezone` text DEFAULT 'America/New_York' NOT NULL,
	`latitude` real,
	`longitude` real,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `venues_slug_unique` ON `venues` (`slug`);--> statement-breakpoint
CREATE INDEX `venues_city_region_idx` ON `venues` (`city`,`region`);
--> statement-breakpoint
INSERT INTO `venues` (`id`, `slug`, `name`, `city`, `region`, `country`, `timezone`, `latitude`, `longitude`, `created_at`, `updated_at`) VALUES
	('venue-msg', 'madison-square-garden', 'Madison Square Garden', 'New York', 'NY', 'USA', 'America/New_York', 40.7505, -73.9934, 1735689600000, 1735689600000),
	('venue-rose-bowl', 'rose-bowl', 'Rose Bowl Stadium', 'Pasadena', 'CA', 'USA', 'America/Los_Angeles', 34.1613, -118.1676, 1735689600000, 1735689600000),
	('venue-wrigley', 'wrigley-field', 'Wrigley Field', 'Chicago', 'IL', 'USA', 'America/Chicago', 41.9484, -87.6553, 1735689600000, 1735689600000);
--> statement-breakpoint
INSERT INTO `card_templates` (`id`, `slug`, `name`, `description`, `theme_name`, `accent_color`, `foil_style`, `is_active`, `created_at`, `updated_at`) VALUES
	('template-vault-classic', 'vault-classic', 'Vault Classic', 'Clean metallic framing for timeless rivalry moments.', 'Classic Chrome', '#D4AF37', 'mirror', true, 1735689600000, 1735689600000),
	('template-stadium-glow', 'stadium-glow', 'Stadium Glow', 'Bright arena lights and high-energy overlays for night games.', 'Neon Lights', '#14B8A6', 'holo', true, 1735689600000, 1735689600000),
	('template-film-strip', 'film-strip', 'Film Strip', 'Cinematic borders for behind-the-scenes and companion shots.', 'Film Story', '#F97316', 'matte', true, 1735689600000, 1735689600000);
