"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Footer() {
  const [backTopVisible, setBackTopVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setBackTopVisible(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.querySelector("input") as HTMLInputElement;
    const btn = form.querySelector("button") as HTMLButtonElement;
    
    btn.innerHTML = '<i class="ri-check-line"></i>';
    btn.style.background = '#1B5E3B';
    input.value = '';
    input.placeholder = "You're subscribed!";
    input.disabled = true;
    
    setTimeout(() => {
      btn.innerHTML = '<i class="ri-send-plane-fill"></i>';
      btn.style.background = '';
      input.placeholder = 'Your email address';
      input.disabled = false;
    }, 3500);
  };

  return (
    <>
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">✦ ROOSTER&apos;S DEN ✦</div>
              <p>Fine Pakistani Cuisine. A heritage of flavour, a tradition of excellence — since 2006.</p>
              <div className="socials">
                <Link href="#" aria-label="Instagram"><i className="ri-instagram-line"></i></Link>
                <Link href="#" aria-label="Facebook"><i className="ri-facebook-line"></i></Link>
                <Link href="#" aria-label="TikTok"><i className="ri-tiktok-line"></i></Link>
                <Link href="#" aria-label="WhatsApp"><i className="ri-whatsapp-line"></i></Link>
              </div>
            </div>
            <div className="footer-col">
              <h5>Explore</h5>
              <ul>
                <li><Link href="#about">Our Story</Link></li>
                <li><Link href="#menu">Menu</Link></li>
                <li><Link href="#specials">Specials</Link></li>
                <li><Link href="#gallery">Gallery</Link></li>
                <li><Link href="#reserve">Reservations</Link></li>
              </ul>
            </div>
            <div className="footer-col">
              <h5>Dining</h5>
              <ul>
                <li><Link href="#signature">Signature Dishes</Link></li>
                <li><Link href="#specials">Weekend Feast</Link></li>
                <li><Link href="#specials">Private Events</Link></li>
                <li><Link href="#reserve">Book a Table</Link></li>
              </ul>
            </div>
            <div className="footer-newsletter">
              <h5>Stay in Touch</h5>
              <p>Get exclusive offers and seasonal updates.</p>
              <form className="newsletter-form" id="newsletterForm" onSubmit={handleNewsletter}>
                <input type="email" placeholder="Your email address" required aria-label="Email address" />
                <button type="submit" aria-label="Subscribe"><i className="ri-send-plane-fill"></i></button>
              </form>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} Rooster&apos;s Den Fine Pakistani Cuisine. All rights reserved.</p>
            <div className="footer-legal">
              <Link href="#">Privacy Policy</Link>
              <Link href="#">Terms</Link>
            </div>
          </div>
        </div>
      </footer>

      <a href="https://wa.me/923001234567" className="wa-float" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
        <i className="ri-whatsapp-line"></i>
      </a>
      <button 
        className={`back-top ${backTopVisible ? "visible" : ""}`} 
        id="backTop" 
        aria-label="Back to top"
        onClick={scrollToTop}
      >
        <i className="ri-arrow-up-line"></i>
      </button>
    </>
  );
}
