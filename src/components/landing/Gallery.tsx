"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function Gallery() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  const galleryItems = [
    { src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=85", thumb: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80", caption: "Dining Room", span2: true, tall: false, delay: "0s" },
    { src: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=85", thumb: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80", caption: "Signature Biryani", span2: false, tall: false, delay: "0.05s" },
    { src: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=85", thumb: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80", caption: "Tandoor Kebabs", span2: false, tall: false, delay: "0.1s" },
    { src: "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=85", thumb: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80", caption: "Iron Wok Karahi", span2: false, tall: false, delay: "0.15s" },
    { src: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=85", thumb: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=900&q=80", caption: "Banquet Spread", span2: true, tall: true, delay: "0.2s" },
    { src: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&q=85", thumb: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80", caption: "Barra Lamb Chops", span2: false, tall: false, delay: "0.25s" },
  ];

  const openLightbox = (idx: number) => {
    setCurrentIdx(idx);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = '';
  };

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev + 1) % galleryItems.length);
  };

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') setCurrentIdx((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
      if (e.key === 'ArrowRight') setCurrentIdx((prev) => (prev + 1) % galleryItems.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

  return (
    <section id="gallery" className="section gallery">
      <div className="container">
        <div className="section-header centered">
          <span className="section-tag">The Experience</span>
          <h2 className="section-title">Gallery</h2>
          <div className="gold-rule center"></div>
        </div>
        <div className="gallery-grid">
          {galleryItems.map((item, idx) => (
            <div
              key={idx}
              className={`g-item reveal-up ${item.span2 ? "span-2" : ""} ${item.tall ? "tall" : ""}`}
              style={{ "--reveal-delay": item.delay } as React.CSSProperties}
              onClick={() => openLightbox(idx)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.thumb} alt={item.caption} loading="lazy" />
              <div className="g-overlay"><span>{item.caption}</span></div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Lightbox */}
      <div 
        className={`lightbox ${lightboxOpen ? "open" : ""}`} 
        id="lightbox" 
        aria-hidden={!lightboxOpen}
        onClick={closeLightbox}
      >
        <button className="lb-close" id="lbClose" aria-label="Close" onClick={closeLightbox}>
          <i className="ri-close-line"></i>
        </button>
        <button className="lb-nav lb-prev" id="lbPrev" aria-label="Previous" onClick={prevImg}>
          <i className="ri-arrow-left-line"></i>
        </button>
        <button className="lb-nav lb-next" id="lbNext" aria-label="Next" onClick={nextImg}>
          <i className="ri-arrow-right-line"></i>
        </button>
        <div className="lb-content" onClick={(e) => e.stopPropagation()}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={galleryItems[currentIdx].src} alt={galleryItems[currentIdx].caption} id="lbImg" />
          <p className="lb-caption" id="lbCaption">{galleryItems[currentIdx].caption}</p>
        </div>
      </div>
    </section>
  );
}
