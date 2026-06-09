"use client";

import Link from "next/link";

export default function Hero() {
  return (
    <section id="hero" className="hero">
      <div
        className="hero-bg"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1920&q=85')",
        }}
      ></div>
      <div className="hero-overlay"></div>
      <div className="jali-overlay" aria-hidden="true"></div>
      <div className="hero-content">
        <div className="hero-urdu" aria-hidden="true">
          روایات
        </div>
        <div className="hero-rule">
          <span className="rule-line"></span>
          <span className="rule-gem">✦</span>
          <span className="rule-line"></span>
        </div>
        <h1 className="hero-title">ROOSTER&apos;S DEN</h1>
        <p className="hero-subtitle">Fine Pakistani Cuisine</p>
        <p className="hero-tagline">A Heritage of Flavour. A Tradition of Excellence.</p>
        <div className="hero-actions">
          <Link href="#menu" className="btn-hero-primary">
            Explore Menu
          </Link>
          <Link href="#reserve" className="btn-hero-outline">
            Reserve a Table
          </Link>
        </div>
      </div>
      <Link href="#about" className="scroll-cue" aria-label="Scroll to content">
        <span>Scroll</span>
        <i className="ri-arrow-down-line"></i>
      </Link>
    </section>
  );
}
