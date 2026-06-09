"use client";

import { useState, useEffect } from "react";

export default function Testimonials() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const testimonials = [
    {
      text: "The Barra Lamb Chops were unlike anything I've tasted. The marinade had incredible depth — clearly a recipe perfected over years. The Kashmiri Chai was the perfect finish to an extraordinary meal.",
      author: "Sana Mirza",
      event: "Anniversary Dinner",
      initials: "SM"
    },
    {
      text: "Rooster's Den set a new standard for fine Pakistani dining. The ambiance feels like stepping into a Mughal palace — warm, opulent and deeply Pakistani. The Mutton Biryani brought tears to my eyes.",
      author: "Imran Shah",
      event: "Corporate Dinner",
      initials: "IS"
    },
    {
      text: "We booked the celebration package for my mother's birthday and it exceeded every expectation. The staff were attentive without being intrusive. The Shahi Tukra was simply divine.",
      author: "Nadia Hussain",
      event: "Birthday Celebration",
      initials: "NH"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const goToSlide = (idx: number) => {
    setCurrentIdx((idx + testimonials.length) % testimonials.length);
  };

  return (
    <section id="testimonials" className="section testimonials">
      <div className="section-bg-pattern" aria-hidden="true"></div>
      <div className="container">
        <div className="section-header centered">
          <span className="section-tag">Guest Voices</span>
          <h2 className="section-title">What Our Guests Say</h2>
          <div className="gold-rule center"></div>
        </div>
        <div className="testimonials-outer">
          <div className="testimonials-track" id="testimonialsTrack" style={{ transform: `translateX(-${currentIdx * 100}%)`, transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)" }}>
            {testimonials.map((t, idx) => (
              <div key={idx} className="testimonial">
                <div className="t-stars">★★★★★</div>
                <blockquote>&quot;{t.text}&quot;</blockquote>
                <div className="t-author">
                  <div className="t-avatar">{t.initials}</div>
                  <div><strong>{t.author}</strong><span>{t.event}</span></div>
                </div>
              </div>
            ))}
          </div>
          <div className="t-controls">
            <button className="t-btn" id="tPrev" aria-label="Previous" onClick={() => goToSlide(currentIdx - 1)}>
              <i className="ri-arrow-left-line"></i>
            </button>
            <div className="t-dots" id="tDots">
              {testimonials.map((_, idx) => (
                <button 
                  key={idx} 
                  className={`t-dot ${idx === currentIdx ? "active" : ""}`} 
                  onClick={() => goToSlide(idx)}
                ></button>
              ))}
            </div>
            <button className="t-btn" id="tNext" aria-label="Next" onClick={() => goToSlide(currentIdx + 1)}>
              <i className="ri-arrow-right-line"></i>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
