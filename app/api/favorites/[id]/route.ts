import {
  apiError,
  enforceRateLimit,
  isJsonRequest,
  isSameOrigin,
  toFavoriteItem,
} from "@/db/favorites";
import { getD1 } from "@/db";

type RouteContext = { params: Promise<{ id: string }> };

const idPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(request: Request, context: RouteContext) {
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

    const { id } = await context.params;
    if (!idPattern.test(id)) {
      return Response.json({ error: "收藏记录编号无效。" }, { status: 400 });
    }

    let payload: { status?: unknown };
    try {
      payload = (await request.json()) as { status?: unknown };
    } catch {
      return Response.json({ error: "请求内容无效。" }, { status: 400 });
    }

    if (payload.status !== "purchased") {
      return Response.json(
        { error: "状态只能更新为 purchased。" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const row = await getD1()
      .prepare(`
        UPDATE favorites
        SET status = 'purchased', purchased_at = ?, updated_at = ?
        WHERE id = ? AND status = 'pending'
        RETURNING
          id, food_id, food_name, food_image, food_summary, category,
          liked_at, status, purchased_at, created_at, updated_at
      `)
      .bind(now, now, id)
      .first<Parameters<typeof toFavoriteItem>[0]>();

    if (!row) {
      const existing = await getD1()
        .prepare("SELECT status FROM favorites WHERE id = ?")
        .bind(id)
        .first<{ status: string }>();
      return Response.json(
        {
          error: existing
            ? "这个食物已经是已购买状态。"
            : "找不到这条收藏记录。",
        },
        { status: existing ? 409 : 404 },
      );
    }

    return Response.json({ favorite: toFavoriteItem(row) });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await enforceRateLimit(request, "favorites-write", 20);

    if (!isSameOrigin(request)) {
      return Response.json({ error: "请求来源无效。" }, { status: 403 });
    }

    const { id } = await context.params;
    if (!idPattern.test(id)) {
      return Response.json({ error: "收藏记录编号无效。" }, { status: 400 });
    }

    const deleted = await getD1()
      .prepare(`
        DELETE FROM favorites
        WHERE id = ? AND status = 'pending'
        RETURNING id
      `)
      .bind(id)
      .first<{ id: string }>();

    if (!deleted) {
      const existing = await getD1()
        .prepare("SELECT status FROM favorites WHERE id = ?")
        .bind(id)
        .first<{ status: string }>();
      return Response.json(
        {
          error: existing
            ? "已购买记录不能从喜爱记录中删除。"
            : "找不到这条收藏记录。",
        },
        { status: existing ? 409 : 404 },
      );
    }

    return Response.json({ deletedId: deleted.id });
  } catch (error) {
    return apiError(error);
  }
}
