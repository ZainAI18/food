"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [progress, setProgress] = useState(0);
  const [selectionProgress, setSelectionProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const selectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setProgress(Math.min(1, window.scrollY / window.innerHeight));
      if (selectionRef.current) {
        const rect = selectionRef.current.getBoundingClientRect();
        const distance = Math.max(1, rect.height - window.innerHeight);
        setSelectionProgress(Math.max(0, Math.min(1, -rect.top / distance)));
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="home">
      <section className="hero-stage" aria-label="品味此刻">
        <div
          className="hero-media"
          style={{ transform: `scale(${1 + progress * 0.08})`, filter: `brightness(${0.78 - progress * 0.42}) blur(${progress * 2}px)` }}
        >
          <video
            ref={videoRef}
            className="hero-video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=2400&q=90"
          >
            <source src="/food1.mp4" type="video/mp4" />
          </video>
          <div className="hero-grain" />
          <div className="hero-shade" />
        </div>

        <div className="hero-copy" style={{ opacity: 1 - progress * 1.6, transform: `translateY(${progress * -42}px)` }}>
          <p className="eyebrow">一场关于味觉的影像</p>
          <h1>品味<br /><em>此刻</em></h1>
          <p className="hero-line">每一道美食，都值得被认真欣赏。</p>
        </div>

        <div className="scroll-cue" style={{ opacity: 1 - progress * 2 }}>
          <span>向下探索</span><i />
        </div>
      </section>

      <section className="manifesto" ref={selectionRef}>
        <div className="manifesto-sticky" style={{ opacity: Math.max(0, Math.min(1, selectionProgress * 4, (1 - selectionProgress) * 3)), transform: `translateY(${(selectionProgress - .5) * -24}px)` }}>
          <p className="section-index">第一幕 — 每日精选</p>
          <div className="manifesto-copy">
            <p>每天更新</p>
            <h2>好好吃饭<br /><em>认真感受每一餐。</em></h2>
            <div className="manifesto-meta"><span>无须注册，打开即可探索</span><span>每日都有新的味觉灵感</span></div>
          </div>
          <div className="ambient-word">味觉</div>
        </div>
      </section>

      <section className="invitation">
        <div className="invitation-image" />
        <div className="invitation-shade" />
        <div className="invitation-content">
          <p className="eyebrow">今日之选</p>
          <h2>让食欲<br /><em>替你作决定。</em></h2>
          <Link className="enter-button" href="/today">
            <span>探索今日美食</span><b aria-hidden="true">↗</b>
          </Link>
        </div>
      </section>
    </main>
  );
}
