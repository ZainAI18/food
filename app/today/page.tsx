"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Food = { id: number; name: string; country: string; category: string; rating: string; calories: string; description: string; feature: string; reason: string; image: string };

export default function Today() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Food | null>(null);

  useEffect(() => {
    fetch("/foods.json").then((r) => r.json()).then((all: Food[]) => {
      const day = Math.floor(new Date().setHours(0, 0, 0, 0) / 86400000);
      const ranked = all.map((food) => ({ food, rank: Math.sin(food.id * 999 + day * 77) })).sort((a, b) => a.rank - b.rank);
      window.setTimeout(() => { setFoods(ranked.slice(0, 10).map((item) => item.food)); setLoading(false); }, 650);
    });
  }, []);
  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "";
    const close = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", close);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", close); };
  }, [selected]);

  return (
    <main className="today-page">
      <header className="today-header">
        <Link href="/" className="wordmark">SAVOR<span>.</span></Link>
        <p>每日精选 · <time>{new Intl.DateTimeFormat("zh-CN", { year:"numeric", month:"long", day:"numeric" }).format(new Date())}</time></p>
      </header>

      <section className="today-intro">
        <p className="eyebrow">为今天精心挑选</p>
        <h1>今日精选<span>十道味觉灵感</span></h1>
        <div className="intro-foot"><p>今天为你挑选的十道美食</p><p>每日自动更新</p></div>
      </section>

      {loading && <div className="loading-copy" role="status">正在准备今天的菜单……</div>}
      <section className={`food-grid ${loading ? "is-loading" : ""}`} aria-label="今日十道精选美食">
        {foods.map((food, index) => (
          <button className="food-card" key={food.id} onClick={() => setSelected(food)} style={{ animationDelay: `${index * 70}ms` }}>
            <span className="food-number">{String(index + 1).padStart(2, "0")}</span>
            <span className="image-wrap"><img src={food.image} alt={`${food.name}，${food.country}${food.category}`} loading="lazy" onError={(e) => { e.currentTarget.style.opacity = "0"; }} /></span>
            <span className="food-info"><span><b>{food.name}</b></span><span className="food-meta">{food.country}<br />{food.category}</span></span>
            <span className="food-rating">★★★★★ <i>{food.rating}</i></span>
          </button>
        ))}
      </section>

      {selected && (
        <div className="modal-backdrop" onMouseDown={(e) => e.currentTarget === e.target && setSelected(null)}>
          <article className="food-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <button className="modal-close" onClick={() => setSelected(null)} aria-label="关闭美食详情">关闭</button>
            <div className="modal-image"><img src={selected.image} alt={selected.name} /><span>{selected.country} · {selected.category}</span></div>
            <div className="modal-content">
              <p className="eyebrow">今日精选</p>
              <h2 id="modal-title">{selected.name}</h2>
              <p className="modal-description">{selected.description}</p>
              <dl><div><dt>热量</dt><dd>{selected.calories}</dd></div><div><dt>特色</dt><dd>{selected.feature}</dd></div><div><dt>推荐理由</dt><dd>{selected.reason}</dd></div></dl>
            </div>
          </article>
        </div>
      )}
    </main>
  );
}
