"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
      
      // Update active hash based on sections
      const sections = document.querySelectorAll<HTMLElement>("section[id]");
      const navH = 100;
      let current = "";
      sections.forEach((section) => {
        if (window.scrollY + navH >= section.offsetTop) {
          current = `#${section.id}`;
        }
      });
      setActiveHash(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Init
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { href: "#about", label: "Our Story" },
    { href: "#menu", label: "Menu" },
    { href: "#specials", label: "Specials" },
    { href: "#gallery", label: "Gallery" },
    { href: "#reserve", label: "Reserve" },
  ];

  return (
    <nav id="navbar" className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="nav-container">
        <Link href="#hero" className="nav-logo">
          <span className="logo-gem">✦</span>
          <span className="logo-text">Burgerz</span>
          <span className="logo-gem">✦</span>
        </Link>
        <ul className="nav-links">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`nav-link ${activeHash === link.href ? "active" : ""}`}
                onClick={closeMobileMenu}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="#reserve" className="btn-nav-cta" onClick={closeMobileMenu}>
          Book a Table
        </Link>
        <button
          className={`hamburger ${mobileMenuOpen ? "open" : ""}`}
          id="hamburger"
          aria-label="Toggle navigation"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
      <div className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`} id="mobileMenu">
        <ul>
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="mobile-nav-link" onClick={closeMobileMenu}>
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="#reserve" className="mobile-nav-link mobile-cta" onClick={closeMobileMenu}>
              Book a Table
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
