import {
  apiError,
  enforceRateLimit,
  getCanonicalFood,
  isJsonRequest,
  isSameOrigin,
  listFavorites,
  toFavoriteItem,
  type FavoriteItem,
} from "@/db/favorites";
import { getD1 } from "@/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await enforceRateLimit(request, "favorites-read", 120);
    const favorites = await listFavorites();
    return Response.json(
      { favorites },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, "favorites-write", 20);

    if (!isSameOrigin(request)) {
      return Response.json({ error: "请求来源无效。" }, { status: 403 });
    }
    if (!isJsonRequest(request)) {
      return Response.json(
        { error: "请求格式必须为 JSON。" },
        { status: 415 },
      );
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 2_048) {
      return Response.json({ error: "请求内容过大。" }, { status: 413 });
    }

    let payload: { foodId?: unknown };
    try {
      payload = (await request.json()) as { foodId?: unknown };
    } catch {
      return Response.json({ error: "请求内容无效。" }, { status: 400 });
    }

    if (
      typeof payload.foodId !== "string" ||
      payload.foodId.length > 80
    ) {
      return Response.json({ error: "食物编号无效。" }, { status: 400 });
    }

    const food = getCanonicalFood(payload.foodId);
    if (!food) {
      return Response.json(
        { error: "菜单中没有这个食物。" },
        { status: 400 },
      );
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    try {
      const row = await getD1()
        .prepare(`
          INSERT INTO favorites (
            id, food_id, food_name, food_image, food_summary, category,
            liked_at, status, purchased_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NULL, ?, ?)
          RETURNING
            id, food_id, food_name, food_image, food_summary, category,
            liked_at, status, purchased_at, created_at, updated_at
        `)
        .bind(
          id,
          food.id,
          food.name,
          food.image,
          food.description,
          food.category,
          now,
          now,
          now,
        )
        .first<Parameters<typeof toFavoriteItem>[0]>();

      return Response.json(
        { favorite: toFavoriteItem(row!) },
        { status: 201 },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (
        message.includes("UNIQUE") ||
        message.includes("unique") ||
        message.includes("favorites.food_id")
      ) {
        const existing = await getD1()
          .prepare(`
            SELECT
              id, food_id, food_name, food_image, food_summary, category,
              liked_at, status, purchased_at, created_at, updated_at
            FROM favorites
            WHERE food_id = ?
          `)
          .bind(food.id)
          .first<Parameters<typeof toFavoriteItem>[0]>();

        return Response.json(
          {
            error: "这个食物已经加入今日喜欢",
            favorite: existing
              ? toFavoriteItem(existing)
              : (null as FavoriteItem | null),
          },
          { status: 409 },
        );
      }
      throw error;
    }
  } catch (error) {
    return apiError(error);
  }
}
