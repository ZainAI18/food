"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type FavoriteItem = {
  id: string;
  foodId: string;
  foodName: string;
  foodImage: string;
  foodSummary: string;
  category: string;
  likedAt: string;
  status: "pending" | "purchased";
  purchasedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FavoriteCandidate = {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
};

type Confirmation =
  | { kind: "add"; product: FavoriteCandidate }
  | { kind: "purchase"; favorite: FavoriteItem }
  | { kind: "delete"; favorite: FavoriteItem };

type FavoritesContextValue = {
  favorites: FavoriteItem[];
  isFavorite: (foodId: string) => boolean;
  requestAdd: (product: FavoriteCandidate) => void;
  openSidebar: () => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function formatDate(value: string | null, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...(withTime
      ? { hour: "2-digit", minute: "2-digit", hour12: false }
      : {}),
  }).format(date);
}

function getDialogCopy(confirmation: Confirmation | null) {
  if (!confirmation) {
    return { title: "", confirmLabel: "" };
  }
  if (confirmation.kind === "add") {
    return {
      title: "确定要将这个食物加入今日喜欢吗？",
      confirmLabel: "确认加入",
    };
  }
  if (confirmation.kind === "purchase") {
    return {
      title: "确定已经购买这个食物了吗？",
      confirmLabel: "确认购买",
    };
  }
  return {
    title: "确定要从今日喜欢中删除这个食物吗？",
    confirmLabel: "确认删除",
  };
}

async function readJson<T>(response: Response) {
  const data = (await response.json().catch(() => ({}))) as T & {
    error?: string;
  };
  if (!response.ok) {
    const error = new Error(data.error || "操作失败，请稍后再试。");
    Object.assign(error, { status: response.status });
    throw error;
  }
  return data;
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const loadFavorites = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/favorites", {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const data = await readJson<{ favorites: FavoriteItem[] }>(response);
      setFavorites(data.favorites);
    } catch {
      setError("今日喜欢暂时无法载入，请稍后再试。");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadFavorites(), 0);
    return () => window.clearTimeout(timer);
  }, [loadFavorites]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") {
        void loadFavorites(true);
      }
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [loadFavorites]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2_400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    document.body.classList.toggle(
      "favorites-overlay-open",
      sidebarOpen || Boolean(confirmation),
    );
    return () => document.body.classList.remove("favorites-overlay-open");
  }, [sidebarOpen, confirmation]);

  useEffect(() => {
    if (confirmation) {
      window.setTimeout(() => confirmButtonRef.current?.focus(), 0);
    }
  }, [confirmation]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || busy) return;
      if (confirmation) {
        setConfirmation(null);
      } else if (sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [busy, confirmation, sidebarOpen]);

  const pendingFavoriteIds = useMemo(
    () =>
      new Set(
        favorites
          .filter((favorite) => favorite.status === "pending")
          .map((favorite) => favorite.foodId),
      ),
    [favorites],
  );
  const pending = useMemo(
    () =>
      favorites
        .filter((favorite) => favorite.status === "pending")
        .sort(
          (a, b) =>
            new Date(b.likedAt).getTime() - new Date(a.likedAt).getTime(),
        ),
    [favorites],
  );
  const purchased = useMemo(
    () =>
      favorites
        .filter((favorite) => favorite.status === "purchased")
        .sort(
          (a, b) =>
            new Date(b.purchasedAt ?? 0).getTime() -
            new Date(a.purchasedAt ?? 0).getTime(),
        ),
    [favorites],
  );

  const requestAdd = useCallback(
    (product: FavoriteCandidate) => {
      if (pendingFavoriteIds.has(product.id)) {
        setToast("这个食物已经加入今日喜欢");
        return;
      }
      setConfirmation({ kind: "add", product });
    },
    [pendingFavoriteIds],
  );

  const showRequestError = (caught: unknown) => {
    const requestError = caught as Error & { status?: number };
    setToast(
      requestError.status === 429
        ? "操作太频繁，请稍后再试。"
        : requestError.message || "操作失败，请稍后再试。",
    );
  };

  const confirmAction = async () => {
    if (!confirmation || busy) return;
    setBusy(true);

    try {
      if (confirmation.kind === "add") {
        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ foodId: confirmation.product.id }),
        });
        const data = await readJson<{ favorite: FavoriteItem }>(response);
        setFavorites((current) => [
          data.favorite,
          ...current.filter(
            (favorite) =>
              !(
                favorite.foodId === data.favorite.foodId &&
                favorite.status === "pending"
              ),
          ),
        ]);
        setToast("已加入今日喜欢");
      } else if (confirmation.kind === "purchase") {
        const response = await fetch(
          `/api/favorites/${encodeURIComponent(confirmation.favorite.id)}`,
          {
            method: "PATCH",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "purchased" }),
          },
        );
        const data = await readJson<{ favorite: FavoriteItem }>(response);
        setFavorites((current) =>
          current.map((favorite) =>
            favorite.id === data.favorite.id ? data.favorite : favorite,
          ),
        );
        setToast("已标记为已购买");
      } else {
        const response = await fetch(
          `/api/favorites/${encodeURIComponent(confirmation.favorite.id)}`,
          { method: "DELETE", headers: { Accept: "application/json" } },
        );
        const data = await readJson<{ deletedId: string }>(response);
        setFavorites((current) =>
          current.filter((favorite) => favorite.id !== data.deletedId),
        );
        setToast("已删除");
      }
      setConfirmation(null);
    } catch (caught) {
      const requestError = caught as Error & { status?: number };
      if (requestError.status === 409) {
        await loadFavorites(true);
        setToast(requestError.message);
        setConfirmation(null);
      } else {
        showRequestError(caught);
      }
    } finally {
      setBusy(false);
    }
  };

  const dialogCopy = getDialogCopy(confirmation);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorite: (foodId) => pendingFavoriteIds.has(foodId),
        requestAdd,
        openSidebar: () => setSidebarOpen(true),
      }}
    >
      {children}

      <button
        type="button"
        className={`favorites-trigger${sidebarOpen ? " is-open" : ""}`}
        onClick={() => setSidebarOpen((open) => !open)}
        aria-label={`${sidebarOpen ? "关闭" : "打开"}今日喜欢，共${pending.length}个等待购买的食物`}
        aria-expanded={sidebarOpen}
        aria-controls="favorites-sidebar"
      >
        <span className="favorites-trigger-heart" aria-hidden="true">♥</span>
        <span className="favorites-trigger-label">今日喜欢</span>
        <span className="favorites-trigger-count" aria-live="polite">
          {loading ? "…" : pending.length}
        </span>
      </button>

      <div
        className={`favorites-layer${sidebarOpen ? " is-open" : ""}`}
        aria-hidden={!sidebarOpen}
      >
        <button
          type="button"
          className="favorites-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-label="关闭今日喜欢"
          tabIndex={sidebarOpen ? 0 : -1}
        />
        <aside
          id="favorites-sidebar"
          className="favorites-sidebar"
          role="dialog"
          aria-modal="true"
          aria-labelledby="favorites-title"
          inert={!sidebarOpen}
        >
          <header className="favorites-sidebar-header">
            <button
              type="button"
              className="favorites-close"
              onClick={() => setSidebarOpen(false)}
              aria-label="关闭今日喜欢侧边栏"
            >
              <span aria-hidden="true">×</span>
            </button>
            <p>公开共享清单</p>
            <h2 id="favorites-title">今日喜欢</h2>
            <span>{pending.length} 个等待购买</span>
          </header>

          <div className="favorites-scroll">
            {loading && (
              <div className="favorites-state" role="status">
                <span className="favorites-spinner" aria-hidden="true" />
                正在载入今日喜欢……
              </div>
            )}

            {!loading && error && (
              <div className="favorites-state" role="alert">
                <p>{error}</p>
                <button type="button" onClick={() => void loadFavorites()}>
                  重新载入
                </button>
              </div>
            )}

            {!loading && !error && (
              <>
                <section aria-labelledby="pending-title">
                  <div className="favorites-section-heading">
                    <h3 id="pending-title">等待购买</h3>
                    <span>{pending.length}</span>
                  </div>

                  {pending.length === 0 ? (
                    <div className="favorites-empty">
                      <span aria-hidden="true">♡</span>
                      <p>还没有喜欢的食物</p>
                      <small>从三个食物分类中点亮一颗爱心吧。</small>
                    </div>
                  ) : (
                    <div className="favorites-list">
                      {pending.map((favorite) => (
                        <article className="favorite-item" key={favorite.id}>
                          <img
                            src={favorite.foodImage}
                            alt={`${favorite.foodName}图片`}
                          />
                          <div className="favorite-item-copy">
                            <span>{favorite.category}</span>
                            <h4>{favorite.foodName}</h4>
                            <p>{favorite.foodSummary}</p>
                            <dl>
                              <div>
                                <dt>喜欢日期</dt>
                                <dd>{formatDate(favorite.likedAt)}</dd>
                              </div>
                              <div>
                                <dt>当前状态</dt>
                                <dd>等待购买</dd>
                              </div>
                            </dl>
                            <div className="favorite-actions">
                              <button
                                type="button"
                                className="favorite-purchase"
                                onClick={() =>
                                  setConfirmation({
                                    kind: "purchase",
                                    favorite,
                                  })
                                }
                              >
                                等待购买
                              </button>
                              <button
                                type="button"
                                className="favorite-delete"
                                onClick={() =>
                                  setConfirmation({
                                    kind: "delete",
                                    favorite,
                                  })
                                }
                              >
                                删除
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section
                  className="favorites-history"
                  aria-labelledby="history-title"
                >
                  <div className="favorites-section-heading">
                    <h3 id="history-title">喜爱记录</h3>
                    <span>{purchased.length}</span>
                  </div>

                  {purchased.length === 0 ? (
                    <p className="favorites-history-empty">
                      购买完成的食物会保存在这里。
                    </p>
                  ) : (
                    <div className="favorites-list">
                      {purchased.map((favorite) => (
                        <article
                          className="favorite-item is-purchased"
                          key={favorite.id}
                        >
                          <img
                            src={favorite.foodImage}
                            alt={`${favorite.foodName}图片`}
                          />
                          <div className="favorite-item-copy">
                            <span>{favorite.category}</span>
                            <h4>{favorite.foodName}</h4>
                            <p>{favorite.foodSummary}</p>
                            <dl>
                              <div>
                                <dt>最初喜欢</dt>
                                <dd>{formatDate(favorite.likedAt)}</dd>
                              </div>
                              <div>
                                <dt>完成购买</dt>
                                <dd>
                                  {formatDate(favorite.purchasedAt, true)}
                                </dd>
                              </div>
                            </dl>
                            <button
                              type="button"
                              className="favorite-purchased"
                              disabled
                            >
                              已购买
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>

          <footer className="favorites-sidebar-footer">
            所有访客共享此清单，请勿添加任何个人资料。
          </footer>
        </aside>
      </div>

      {confirmation && (
        <div
          className="confirm-backdrop"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && !busy) {
              setConfirmation(null);
            }
          }}
        >
          <section
            className="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-food"
          >
            <span className="confirm-heart" aria-hidden="true">
              {confirmation.kind === "delete" ? "×" : "♥"}
            </span>
            <h2 id="confirm-title">{dialogCopy.title}</h2>
            <p id="confirm-food">
              {confirmation.kind === "add"
                ? confirmation.product.name
                : confirmation.favorite.foodName}
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className={
                  confirmation.kind === "delete"
                    ? "confirm-danger"
                    : "confirm-primary"
                }
                onClick={() => void confirmAction()}
                disabled={busy}
                ref={confirmButtonRef}
              >
                {busy ? "正在处理……" : dialogCopy.confirmLabel}
              </button>
              <button
                type="button"
                className="confirm-cancel"
                onClick={() => setConfirmation(null)}
                disabled={busy}
              >
                取消
              </button>
            </div>
          </section>
        </div>
      )}

      {toast && (
        <div className="favorites-toast" role="status" aria-live="polite">
          <span aria-hidden="true">♥</span>
          {toast}
        </div>
      )}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const value = useContext(FavoritesContext);
  if (!value) {
    throw new Error("useFavorites 必须在 FavoritesProvider 中使用。");
  }
  return value;
}
