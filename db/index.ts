import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getD1(): D1Database {
  if (!env.DB) {
    throw new Error("共享数据库暂时不可用。");
  }

  return env.DB as D1Database;
}

export function getDb() {
  return drizzle(getD1(), { schema });
}
