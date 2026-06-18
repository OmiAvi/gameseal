ALTER TABLE `moments` ADD `matchup` text DEFAULT 'Matchup pending' NOT NULL;
--> statement-breakpoint
ALTER TABLE `moments` ADD `final_score` text DEFAULT 'Score pending' NOT NULL;
--> statement-breakpoint
ALTER TABLE `moments` ADD `section` text;
--> statement-breakpoint
ALTER TABLE `moments` ADD `row` text;
--> statement-breakpoint
ALTER TABLE `moments` ADD `seat` text;
--> statement-breakpoint
ALTER TABLE `moments` ADD `memory_rating` integer DEFAULT 7 NOT NULL;
