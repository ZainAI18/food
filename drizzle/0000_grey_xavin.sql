CREATE TABLE `favorites` (
	`id` text PRIMARY KEY NOT NULL,
	`food_id` text NOT NULL,
	`food_name` text NOT NULL,
	`food_image` text NOT NULL,
	`food_summary` text NOT NULL,
	`category` text NOT NULL,
	`liked_at` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`purchased_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "favorites_status_check" CHECK("favorites"."status" in ('pending', 'purchased'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `favorites_food_id_unique` ON `favorites` (`food_id`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`rate_key` text PRIMARY KEY NOT NULL,
	`window_start` integer NOT NULL,
	`request_count` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
