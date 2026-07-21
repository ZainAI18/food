"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Food = { id: number; name: string; original: string; country: string; category: string; rating: string; calories: string; description: string; feature: string; reason: string; image: string };

export default function Today() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [selected, setSelected] = useState<Food | null>(null);

  useEffect(() => { fetch("/today.json").then((r) => r.json()).then(setFoods); }, []);
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
        <p>DAILY SELECTION · <time>21 JUL 2026</time></p>
      </header>

      <section className="today-intro">
        <p className="eyebrow">CURATED FOR TODAY</p>
        <h1>今日精选<span>Today&apos;s Top 10</span></h1>
        <div className="intro-foot"><p>Ten dishes. Ten places.<br />One delicious day.</p><p>Automatically<br />updated daily</p></div>
      </section>

      <section className="food-grid" aria-label="Today's top ten foods">
        {foods.map((food, index) => (
          <button className="food-card" key={food.id} onClick={() => setSelected(food)} style={{ animationDelay: `${index * 70}ms` }}>
            <span className="food-number">{String(index + 1).padStart(2, "0")}</span>
            <span className="image-wrap"><img src={food.image} alt={food.name} /></span>
            <span className="food-info"><span><b>{food.name}</b><small>{food.original}</small></span><span className="food-meta">{food.country}<br />{food.category}</span></span>
            <span className="food-rating">★★★★★ <i>{food.rating}</i></span>
          </button>
        ))}
      </section>

      {selected && (
        <div className="modal-backdrop" onMouseDown={(e) => e.currentTarget === e.target && setSelected(null)}>
          <article className="food-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <button className="modal-close" onClick={() => setSelected(null)} aria-label="关闭">×</button>
            <div className="modal-image"><img src={selected.image} alt={selected.name} /><span>{selected.country} · {selected.category}</span></div>
            <div className="modal-content">
              <p className="eyebrow">TODAY&apos;S SELECTION</p>
              <h2 id="modal-title">{selected.name}<small>{selected.original}</small></h2>
              <p className="modal-description">{selected.description}</p>
              <dl><div><dt>热量</dt><dd>{selected.calories}</dd></div><div><dt>特色</dt><dd>{selected.feature}</dd></div><div><dt>推荐理由</dt><dd>{selected.reason}</dd></div></dl>
            </div>
          </article>
        </div>
      )}
    </main>
  );
}
