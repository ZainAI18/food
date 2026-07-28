import { sql } from "drizzle-orm";
import {
  check,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const favorites = sqliteTable(
  "favorites",
  {
    id: text("id").primaryKey(),
    foodId: text("food_id").notNull(),
    foodName: text("food_name").notNull(),
    foodImage: text("food_image").notNull(),
    foodSummary: text("food_summary").notNull(),
    category: text("category").notNull(),
    likedAt: text("liked_at").notNull(),
    status: text("status", { enum: ["pending", "purchased"] })
      .notNull()
      .default("pending"),
    purchasedAt: text("purchased_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("favorites_food_id_unique").on(table.foodId),
    check(
      "favorites_status_check",
      sql`${table.status} in ('pending', 'purchased')`,
    ),
  ],
);

export const rateLimits = sqliteTable("rate_limits", {
  rateKey: text("rate_key").primaryKey(),
  windowStart: integer("window_start").notNull(),
  requestCount: integer("request_count").notNull().default(1),
  updatedAt: text("updated_at").notNull(),
});
