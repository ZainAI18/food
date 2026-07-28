"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFavorites } from "../components/FavoritesProvider";

type MenuProduct = {
  id: string;
  name: string;
  description: string;
  happiness: number;
  image: string;
  tag: string;
  category: string;
};

type MenuCategory = {
  id: string;
  name: string;
  description: string;
  entryDescription: string;
  coverImage: string;
  products: MenuProduct[];
};

type MenuData = { categories: MenuCategory[] };

export default function MenuPage() {
  const { isFavorite, requestAdd } = useFavorites();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<MenuCategory | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<MenuProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/menu.json")
      .then((response) => {
        if (!response.ok) throw new Error("菜单资料载入失败");
        return response.json() as Promise<MenuData>;
      })
      .then((data) => setCategories(data.categories))
      .catch(() => setError("菜单暂时无法载入，请稍后再试。"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-modal-open", Boolean(selectedProduct));
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedProduct(null);
    };
    window.addEventListener("keydown", close);
    return () => {
      document.body.classList.remove("menu-modal-open");
      window.removeEventListener("keydown", close);
    };
  }, [selectedProduct]);

  return (
    <main className="today-page menu-page">
      <header className="today-header">
        <Link href="/" className="wordmark" aria-label="返回余温首页">余温<span>。</span></Link>
        <p>{activeCategory ? `${activeCategory.name}菜单` : "我们的菜单"}</p>
      </header>

      {loading && <div className="menu-status" role="status">正在准备菜单……</div>}
      {error && <div className="menu-status" role="alert">{error}</div>}

      {!loading && !error && !activeCategory && (
        <>
          <section className="menu-intro">
            <p className="eyebrow">用心准备每一餐</p>
            <h1>我们的菜单</h1>
            <p className="menu-lead">从一份温暖早餐，到丰盛午餐，再配上一杯喜欢的饮料。</p>
          </section>

          <section className="menu-category-list" aria-label="菜单分类">
            {categories.map((category, index) => (
              <button
                className={`menu-category-card menu-category-${category.id}`}
                key={category.id}
                onClick={() => {
                  setActiveCategory(category);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                style={{ animationDelay: `${index * 150}ms` }}
                aria-label={`查看${category.name}`}
              >
                {category.coverImage && <img src={category.coverImage} alt={`${category.name}分类图片`} />}
                <span className="menu-category-shade" />
                <span className="menu-category-copy">
                  <span className="menu-category-index">第{["一", "二", "三"][index]}类</span>
                  <strong>{category.name}</strong>
                  <span>{category.entryDescription}</span>
                </span>
                <span className="menu-category-enter">查看{category.name}<i aria-hidden="true">→</i></span>
              </button>
            ))}
          </section>
        </>
      )}

      {!loading && !error && activeCategory && (
        <>
          <section className="menu-detail-intro">
            <button className="menu-back" onClick={() => setActiveCategory(null)} aria-label="返回菜单分类">← 返回菜单</button>
            <p className="eyebrow">余温餐厅</p>
            <h1>{activeCategory.name}菜单</h1>
            <p>{activeCategory.description}</p>
          </section>

          {activeCategory.products.length > 0 ? (
            <section className="menu-product-grid" aria-label={`${activeCategory.name}产品列表`}>
              {activeCategory.products.map((product, index) => (
                <article
                  className="menu-product-card"
                  key={product.id}
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <button
                    type="button"
                    className="menu-product-open"
                    onClick={() => setSelectedProduct(product)}
                    aria-label={`查看${product.name}详情`}
                  >
                    <span className="menu-product-image">
                      {product.image ? (
                        <img src={product.image} alt={`${product.name}图片`} />
                      ) : (
                        <span className="menu-placeholder" role="img" aria-label="图片待添加">
                          <i aria-hidden="true"><b /><b /></i>
                          <span>图片待添加</span>
                        </span>
                      )}
                    </span>
                    <span className="menu-product-content">
                      <span className="menu-product-id">编号 {product.id}</span>
                      <strong>{product.name}</strong>
                      <span className="menu-product-description">{product.description}</span>
                      <span className="menu-product-meta">
                        <span>{product.tag}</span>
                        <b className="menu-happiness" aria-label={`开心指数${product.happiness}颗满意笑脸`}>{"😊".repeat(product.happiness)}</b>
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`card-favorite-button${isFavorite(product.id) ? " is-favorite" : ""}`}
                    onClick={() => requestAdd(product)}
                    aria-label={`${isFavorite(product.id) ? "已收藏" : "收藏"}${product.name}`}
                    aria-pressed={isFavorite(product.id)}
                    title={isFavorite(product.id) ? "已加入今日喜欢" : "加入今日喜欢"}
                  >
                    <span aria-hidden="true">{isFavorite(product.id) ? "♥" : "♡"}</span>
                  </button>
                </article>
              ))}
            </section>
          ) : (
            <div className="menu-status">这个分类暂时还没有产品。</div>
          )}
        </>
      )}

      {selectedProduct && (
        <div className="modal-backdrop" onMouseDown={(event) => event.currentTarget === event.target && setSelectedProduct(null)}>
          <article className="food-modal menu-modal" role="dialog" aria-modal="true" aria-labelledby="menu-modal-title">
            <button className="modal-close" onClick={() => setSelectedProduct(null)} aria-label="关闭菜品详情">关闭</button>
            <div className="modal-image menu-modal-image">
              {selectedProduct.image ? (
                <img src={selectedProduct.image} alt={`${selectedProduct.name}图片`} />
              ) : (
                <span className="menu-placeholder" role="img" aria-label="图片待添加">
                  <i aria-hidden="true"><b /><b /></i>
                  <span>图片待添加</span>
                </span>
              )}
              <span>{selectedProduct.category}</span>
            </div>
            <div className="modal-content">
              <p className="eyebrow">{selectedProduct.tag}</p>
              <h2 id="menu-modal-title">{selectedProduct.name}</h2>
              <p className="modal-description">{selectedProduct.description}</p>
              <dl>
                <div><dt>开心指数</dt><dd className="menu-happiness" aria-label={`开心指数${selectedProduct.happiness}颗满意笑脸`}>{"😊".repeat(selectedProduct.happiness)}</dd></div>
                <div><dt>分类</dt><dd>{selectedProduct.category}</dd></div>
                <div><dt>产品编号</dt><dd>{selectedProduct.id}</dd></div>
              </dl>
            </div>
          </article>
        </div>
      )}
    </main>
  );
}
