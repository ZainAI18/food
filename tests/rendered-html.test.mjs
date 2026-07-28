import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

test("首页全局挂载今日喜欢入口", async () => {
  const [layout, home, provider] = await Promise.all([
    readFile(new URL("app/layout.tsx", projectRoot), "utf8"),
    readFile(new URL("app/page.tsx", projectRoot), "utf8"),
    readFile(
      new URL("app/components/FavoritesProvider.tsx", projectRoot),
      "utf8",
    ),
  ]);

  assert.match(layout, /<FavoritesProvider>\{children\}<\/FavoritesProvider>/);
  assert.match(layout, /title:\s*"余温｜品味此刻"/);
  assert.match(home, /品味/);
  assert.match(provider, /className=\{`favorites-trigger/);
  assert.match(provider, /aria-controls="favorites-sidebar"/);
  assert.match(provider, /id="favorites-title">今日喜欢/);
  assert.doesNotMatch(`${layout}\n${home}`, /codex-preview|Building your site/i);
});

test("保留三个菜单分类并为菜品卡片提供收藏入口", async () => {
  const [menuText, pageSource] = await Promise.all([
    readFile(new URL("public/menu.json", projectRoot), "utf8"),
    readFile(new URL("app/today/page.tsx", projectRoot), "utf8"),
  ]);
  const menu = JSON.parse(menuText.replace(/^\uFEFF/, ""));

  assert.equal(menu.categories.length, 3);
  assert.deepEqual(
    menu.categories.map((category) => category.id),
    ["breakfast", "lunch", "drinks"],
  );
  assert.match(pageSource, /card-favorite-button/);
  assert.match(pageSource, /requestAdd\(product\)/);
  assert.match(pageSource, /setSelectedProduct\(product\)/);
});

test("共享收藏接口启用数据库校验、待购买唯一约束与频率限制", async () => {
  const [hostingText, migrations, collectionRoute, itemRoute, helper, provider] =
    await Promise.all([
      readFile(new URL(".openai/hosting.json", projectRoot), "utf8"),
      Promise.all([
        readFile(new URL("drizzle/0000_grey_xavin.sql", projectRoot), "utf8"),
        readFile(
          new URL("drizzle/0001_breezy_bishop.sql", projectRoot),
          "utf8",
        ),
      ]).then((parts) => parts.join("\n")),
      readFile(new URL("app/api/favorites/route.ts", projectRoot), "utf8"),
      readFile(new URL("app/api/favorites/[id]/route.ts", projectRoot), "utf8"),
      readFile(new URL("db/favorites.ts", projectRoot), "utf8"),
      readFile(
        new URL("app/components/FavoritesProvider.tsx", projectRoot),
        "utf8",
      ),
    ]);

  assert.equal(JSON.parse(hostingText).d1, "DB");
  assert.match(migrations, /favorites_food_id_unique/);
  assert.match(migrations, /DROP INDEX `favorites_food_id_unique`/);
  assert.match(
    migrations,
    /CREATE UNIQUE INDEX `favorites_food_id_pending_unique`[\s\S]*WHERE "favorites"\."status" = 'pending'/,
  );
  assert.match(migrations, /CHECK\("favorites"\."status" in \('pending', 'purchased'\)\)/);
  assert.match(collectionRoute, /getCanonicalFood\(payload\.foodId\)/);
  assert.match(collectionRoute, /status:\s*201/);
  assert.match(itemRoute, /status = 'purchased'/);
  assert.match(itemRoute, /status = 'pending'/);
  assert.match(helper, /enforceRateLimit/);
  assert.match(helper, /ON CONFLICT\(rate_key\)/);
  assert.match(helper, /favorites_food_id_pending_unique/);
  assert.match(helper, /WHERE status = 'pending'/);
  assert.match(provider, /favorite\.status === "pending"/);
  assert.match(provider, /pendingFavoriteIds\.has\(foodId\)/);
});
