"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const onScroll = () => setProgress(Math.min(1, window.scrollY / window.innerHeight));
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="home">
      <section className="hero-stage" aria-label="Discover food">
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
            poster="https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=2400&q=90"
          >
            <source src="https://videos.pexels.com/video-files/4253011/4253011-hd_1920_1080_25fps.mp4" type="video/mp4" />
          </video>
          <div className="hero-grain" />
          <div className="hero-shade" />
        </div>

        <div className="hero-copy" style={{ opacity: 1 - progress * 1.6, transform: `translateY(${progress * -42}px)` }}>
          <p className="eyebrow">A FILM ABOUT TASTE</p>
          <h1>DISCOVER<br /><em>FOOD</em></h1>
          <p className="hero-line">One unforgettable bite at a time.</p>
        </div>

        <div className="scroll-cue" style={{ opacity: 1 - progress * 2 }}>
          <span>SCROLL TO TASTE</span><i />
        </div>
      </section>

      <section className="manifesto">
        <p className="section-index">01 — THE SELECTION</p>
        <div className="manifesto-copy">
          <p>EVERY DAY</p>
          <h2>10 carefully<br />selected <em>foods.</em></h2>
          <div className="manifesto-meta"><span>Curated by appetite</span><span>Updated daily</span></div>
        </div>
        <div className="ambient-word">TASTE</div>
      </section>

      <section className="invitation">
        <div className="invitation-image" />
        <div className="invitation-shade" />
        <div className="invitation-content">
          <p className="eyebrow">TODAY&apos;S EDIT</p>
          <h2>Let desire<br /><em>choose the menu.</em></h2>
          <Link className="enter-button" href="/today">
            <span>探索今日美食</span><b aria-hidden="true">↗</b>
          </Link>
        </div>
      </section>
    </main>
  );
}
