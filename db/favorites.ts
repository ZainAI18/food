import menuData from "../public/menu.json";
import { getD1 } from "./index";

export type FavoriteStatus = "pending" | "purchased";

export type FavoriteItem = {
  id: string;
  foodId: string;
  foodName: string;
  foodImage: string;
  foodSummary: string;
  category: string;
  likedAt: string;
  status: FavoriteStatus;
  purchasedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type FavoriteRow = {
  id: string;
  food_id: string;
  food_name: string;
  food_image: string;
  food_summary: string;
  category: string;
  liked_at: string;
  status: FavoriteStatus;
  purchased_at: string | null;
  created_at: string;
  updated_at: string;
};

type MenuFood = {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
};

const foods = new Map<string, MenuFood>(
  menuData.categories.flatMap((category) =>
    category.products.map((product) => [
      product.id,
      {
        id: product.id,
        name: product.name,
        description: product.description,
        image: product.image,
        category: product.category,
      },
    ] as const),
  ),
);

let schemaPromise: Promise<void> | null = null;

export class RateLimitError extends Error {}

export function getCanonicalFood(foodId: string) {
  return foods.get(foodId);
}

export function toFavoriteItem(row: FavoriteRow): FavoriteItem {
  return {
    id: row.id,
    foodId: row.food_id,
    foodName: row.food_name,
    foodImage: row.food_image,
    foodSummary: row.food_summary,
    category: row.category,
    likedAt: row.liked_at,
    status: row.status,
    purchasedAt: row.purchased_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export function isJsonRequest(request: Request) {
  return request.headers
    .get("content-type")
    ?.toLowerCase()
    .startsWith("application/json");
}

export async function ensureFavoriteSchema() {
  if (!schemaPromise) {
    const db = getD1();
    schemaPromise = db
      .batch([
        db.prepare(`
          CREATE TABLE IF NOT EXISTS favorites (
            id TEXT PRIMARY KEY NOT NULL,
            food_id TEXT NOT NULL UNIQUE,
            food_name TEXT NOT NULL,
            food_image TEXT NOT NULL,
            food_summary TEXT NOT NULL,
            category TEXT NOT NULL,
            liked_at TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'purchased')),
            purchased_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        `),
        db.prepare(`
          CREATE INDEX IF NOT EXISTS favorites_status_purchased_at_idx
          ON favorites (status, purchased_at DESC)
        `),
        db.prepare(`
          CREATE TABLE IF NOT EXISTS rate_limits (
            rate_key TEXT PRIMARY KEY NOT NULL,
            window_start INTEGER NOT NULL,
            request_count INTEGER NOT NULL DEFAULT 1,
            updated_at TEXT NOT NULL
          )
        `),
      ])
      .then(() => undefined)
      .catch((error) => {
        schemaPromise = null;
        throw error;
      });
  }

  return schemaPromise;
}

export async function enforceRateLimit(
  request: Request,
  action: string,
  limit: number,
) {
  await ensureFavoriteSchema();
  const db = getD1();
  const rawIp =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0] ??
    "local";
  const ip = rawIp.trim().slice(0, 80);
  const windowStart = Math.floor(Date.now() / 60_000);
  const now = new Date().toISOString();

  const result = await db
    .prepare(`
      INSERT INTO rate_limits (
        rate_key, window_start, request_count, updated_at
      ) VALUES (?, ?, 1, ?)
      ON CONFLICT(rate_key) DO UPDATE SET
        window_start = excluded.window_start,
        request_count = CASE
          WHEN rate_limits.window_start = excluded.window_start
            THEN rate_limits.request_count + 1
          ELSE 1
        END,
        updated_at = excluded.updated_at
      RETURNING request_count
    `)
    .bind(`${action}:${ip}`, windowStart, now)
    .first<{ request_count: number }>();

  if ((result?.request_count ?? 1) > limit) {
    throw new RateLimitError("操作太频繁，请稍后再试。");
  }
}

export async function listFavorites() {
  await ensureFavoriteSchema();
  const result = await getD1()
    .prepare(`
      SELECT
        id, food_id, food_name, food_image, food_summary, category,
        liked_at, status, purchased_at, created_at, updated_at
      FROM favorites
      ORDER BY
        CASE WHEN status = 'pending' THEN 0 ELSE 1 END,
        CASE WHEN status = 'pending' THEN liked_at END DESC,
        purchased_at DESC
    `)
    .all<FavoriteRow>();

  return result.results.map(toFavoriteItem);
}

export function apiError(error: unknown) {
  if (error instanceof RateLimitError) {
    return Response.json(
      { error: error.message },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  console.error("Favorites API error", error);
  return Response.json(
    { error: "操作失败，请稍后再试。" },
    { status: 500 },
  );
}
