import Link from "next/link";
import Image from "next/image";

export default function About() {
  return (
    <section id="about" className="section about">
      <div className="container">
        <div className="about-grid">
          <div className="about-text reveal-left">
            <span className="section-tag">Our Heritage</span>
            <h2 className="section-title">A Legacy Rooted<br />in Tradition</h2>
            <div className="gold-rule"></div>
            <p>Born from the royal kitchens of the Mughal era, Rooster&apos;s Den brings centuries of culinary tradition to your table. Every dish is a story — of spice routes, of empire, of the warm hospitality that defines Pakistani culture.</p>
            <p>Our master chefs spend years perfecting recipes passed down through generations, using hand-ground spices, slow-burning fires, and ingredients sourced from across Pakistan&apos;s diverse regions.</p>
            <div className="about-stats">
              <div className="stat">
                <span className="stat-num">18+</span>
                <span className="stat-label">Years of Excellence</span>
              </div>
              <div className="stat">
                <span className="stat-num">60+</span>
                <span className="stat-label">Heritage Recipes</span>
              </div>
              <div className="stat">
                <span className="stat-num">4</span>
                <span className="stat-label">Master Chefs</span>
              </div>
            </div>
            <Link href="#menu" className="btn-primary">Discover Our Menu</Link>
          </div>
          <div className="about-visual reveal-right">
            <div className="about-img-frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80" alt="Rooster's Den dining room" loading="lazy" />
            </div>
            <div className="about-badge">
              <span className="badge-gem">✦</span>
              <span className="badge-year">Est. 2006</span>
            </div>
            <div className="about-accent-line"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
