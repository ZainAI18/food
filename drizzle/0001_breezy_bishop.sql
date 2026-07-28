DROP INDEX `favorites_food_id_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `favorites_food_id_pending_unique` ON `favorites` (`food_id`) WHERE "favorites"."status" = 'pending';