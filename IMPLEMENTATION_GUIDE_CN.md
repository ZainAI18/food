# “今日喜欢 / 购物车”连接与修改说明

本项目没有需要手工复制的独立 `.html` 文件。页面由 React/Next 的
`.tsx` 组件和 `app/globals.css` 生成，构建后会自动输出可部署的 HTML、
JavaScript 和 CSS。请修改源文件，不要直接编辑 `dist/`。

## 一、这次改了什么

### 页面与交互

- `app/components/FavoritesProvider.tsx`
  - 新增全站共用的“今日喜欢 / 购物车”状态。
  - 新增右上角固定爱心入口、收藏数量、右侧 Sidebar、加载与错误状态。
  - 新增加入、确认购买、删除确认弹窗和操作提示。
  - 新增待购买列表和按购买时间倒序的“喜爱记录”。
  - 菜品确认购买后，卡片爱心恢复为空心并可以再次收藏；旧的购买记录不会被覆盖。
  - 页面获得焦点或重新打开 Sidebar 时，会重新读取共享数据。
- `app/layout.tsx`
  - 在整站最外层接入 `FavoritesProvider`，因此首页加载后立即显示爱心入口。
  - 更新网站描述和社交分享图片。
- `app/today/page.tsx`
  - 保留原有三个分类、菜品列表和菜品详情。
  - 每张菜品卡片新增空心/实心爱心按钮。
  - 保留点击卡片打开详情的原功能。
- `app/globals.css`
  - 新增 Sidebar、遮罩层、列表卡片、弹窗、提示和爱心按钮样式。
  - 新增 hover、active、disabled、focus-visible 和手机端样式。
- `public/og-favorites.png`
  - 新增与“余温 / 今日喜欢”风格一致的分享预览图。

### 后端与数据库

- `.openai/hosting.json`
  - 启用名为 `DB` 的平台 D1 数据库绑定。
- `db/schema.ts`
  - 新增 `favorites` 和 `rate_limits` 两张表。
- `db/favorites.ts`
  - 新增建表保护、菜单核对、数据转换和按 IP 的每分钟频率限制。
- `app/api/favorites/route.ts`
  - `GET /api/favorites`：读取所有人的公共清单。
  - `POST /api/favorites`：只接收 `foodId`，再从 `public/menu.json`
    读取官方名称、图片、简介和分类。
- `app/api/favorites/[id]/route.ts`
  - `PATCH /api/favorites/:id`：把 `pending` 更新为 `purchased`。
  - `DELETE /api/favorites/:id`：只允许删除 `pending` 项目。
- `drizzle/0000_grey_xavin.sql`
  - 可部署的数据库迁移；包含唯一食物编号和状态检查约束。
- `drizzle/0001_*.sql`
  - 把唯一约束改为“同一种食物只能有一个等待购买项”，允许已购买后再次收藏，
    同时保留所有已购买历史。
- `tests/rendered-html.test.mjs`
  - 更新为新网站的首页、三个分类、数据库约束和接口保护测试。
- `package.json`
  - 将开发与构建命令改为 Windows、macOS 和 Linux 都能执行的形式。

## 二、本地运行步骤

1. 安装 Node.js 22.13 或更高版本。
2. 在终端进入项目目录：

   ```powershell
   cd C:\Users\dpplu\Documents\Codex\2026-07-28\pu\food
   ```

3. 安装依赖：

   ```powershell
   npm install
   ```

4. 启动开发网站：

   ```powershell
   npm run dev
   ```

5. 打开终端显示的 `Local` 地址，例如 `http://localhost:3000/`。
6. 检查正式构建和测试：

   ```powershell
   npm test
   ```

本地开发数据库保存在项目自己的 `.wrangler` 目录中，不使用
`localStorage`。删除 `.wrangler` 会清空本地测试数据，但不会影响线上数据库。

## 三、线上数据库怎样连接

1. `.openai/hosting.json` 的 `d1` 已设置为 `DB`。
2. 发布到 Sites 时，平台会为这个逻辑名称连接真实的线上 D1 数据库。
3. 发布包会携带 `drizzle/0000_grey_xavin.sql`，由平台应用数据库迁移。
4. 后端运行时也会执行安全的 `CREATE TABLE IF NOT EXISTS`，避免首次请求时
   表还未准备好。
5. 前端只能通过 `/api/favorites` 访问数据，不能直接访问数据库。
6. 所有访客共用一个列表，不需要登录，也不会保存姓名、地址、电话或邮箱。

请不要把 `.openai/hosting.json` 的 `d1` 改回 `null`，否则线上 API
无法连接共享数据库。

## 四、接口连接方式

### 读取公共清单

```http
GET /api/favorites
Accept: application/json
```

### 加入今日喜欢

```http
POST /api/favorites
Content-Type: application/json

{"foodId":"breakfast-001"}
```

不要从前端提交名称、图片或简介。后端会根据 `foodId` 从现有菜单核对，
从而防止伪造和无效数据。

### 确认购买

```http
PATCH /api/favorites/{收藏记录id}
Content-Type: application/json

{"status":"purchased"}
```

### 删除等待购买项

```http
DELETE /api/favorites/{收藏记录id}
```

后端保护包括：

- `foodId` 必须存在于 `public/menu.json`。
- 同一个食物在“等待购买”状态下只能有一条记录，无法重复加入。
- 食物改为“已购买”后可以再次收藏，原来的已购买记录会继续保留。
- `status` 只能为 `pending` 或 `purchased`。
- 只有 `pending` 可以删除或改为 `purchased`。
- 写入接口限制为每个来源每分钟 20 次，读取限制为每分钟 120 次。
- 浏览器写请求必须来自网站同源地址。

## 五、以后怎样增加或修改菜品

1. 把菜品图片放入 `public/images/menu/<分类>/`。
2. 编辑 `public/menu.json` 对应分类的 `products`。
3. 保证每个菜品 `id` 永远唯一，已经上线的 `id` 不要随意更改。
4. 填写 `name`、`description`、`image`、`category` 等现有字段。
5. 不需要修改收藏 API；后端会自动读取更新后的菜单。
6. 执行 `npm test`，然后重新发布。

## 六、怎样调整页面

- 改首页文字或链接：`app/page.tsx`
- 改三个分类和菜品卡片：`app/today/page.tsx`
- 改 Sidebar 内容和操作：`app/components/FavoritesProvider.tsx`
- 改颜色、宽度、手机布局：`app/globals.css`
- 改数据库字段：`db/schema.ts`，然后执行：

  ```powershell
  npm run db:generate
  ```

生成新迁移后，检查 SQL，再构建和发布。不要直接修改旧迁移来更新已经上线的数据库。

## 七、验收建议

1. 首页未进入分类前，确认右上角爱心和数量可见。
2. 用两个不同浏览器打开网站。
3. 在浏览器 A 收藏一个食物，确认弹窗、提示、计数和实心爱心立即更新。
4. 在浏览器 B 刷新，确认看到同一条数据。
5. 在浏览器 A 确认购买，确认项目从待购买区进入喜爱记录。
6. 确认购买后，检查原菜品卡片爱心恢复为空心，并可再次点击收藏。
7. 再次收藏同一菜品，确认它重新进入等待购买，同时旧的喜爱记录仍然存在。
8. 在浏览器 B 刷新，确认购买日期、时间和已购买状态仍然存在。
9. 新增一个等待购买项目后删除，确认不会进入喜爱记录。
10. 用手机或窄窗口确认 Sidebar 占据大部分屏幕且仍能关闭。

## 八、Git 保存步骤（可选）

```powershell
git status
git add .openai app db drizzle public/og-favorites.png tests package.json IMPLEMENTATION_GUIDE_CN.md
git commit -m "Add shared today favorites and purchase history"
git push origin main
```

只有在你确认要把这些改动推送到 GitHub 时才执行最后一行。
