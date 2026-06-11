"use client";

import { useState, useEffect } from "react";
import "./landing.css";

const FEATURES = [
  { icon: "ri-qr-scan-2-line",         title: "QR Menu Management",       desc: "Update prices, photos, and availability instantly. No reprinting — every menu change goes live in seconds." },
  { icon: "ri-dashboard-3-line",        title: "Live Kitchen Dashboard",    desc: "Every order flows to the kitchen screen the moment it's placed. Zero lost tickets, zero miscommunication." },
  { icon: "ri-layout-grid-line",        title: "Table & Session Control",   desc: "See every table's live status, active session, and billing round at a glance from one admin screen." },
  { icon: "ri-service-line",           title: "Waiter & Bill Alerts",      desc: "Staff get instant pings when a guest calls for help or requests the bill — no waving, no shouting." },
  { icon: "ri-user-star-line",         title: "Customer Profiles",         desc: "Recognize returning guests, track visit history, and build loyalty with zero manual effort." },
  { icon: "ri-bar-chart-grouped-line", title: "Revenue Analytics",         desc: "Daily revenue, top-selling items, and peak-hour heatmaps — all live, no spreadsheets required." },
];

const STEPS = [
  { n: "01", title: "Create Your Account",    desc: "Sign up and add your restaurant details. Takes under two minutes." },
  { n: "02", title: "Build Your Menu",         desc: "Add items with names, photos, prices, and categories. Edit any time." },
  { n: "03", title: "Add Tables & Print QRs", desc: "Define your tables, generate printable QR codes, stick them on." },
  { n: "04", title: "Go Live",                desc: "Guests scan, order, and pay. You watch it all in real time." },
];

const TESTIMONIALS = [
  { i: "AM", name: "Ahmed Malik",   role: "The Spice Garden",  text: "We deployed Cognos across 14 tables in one afternoon. Order errors dropped to near-zero and our waitstaff finally stopped chasing people down for orders." },
  { i: "FS", name: "Fatima Sheikh", role: "Casa Bella",        text: "The admin dashboard is outstanding. I can watch every table from my office and the kitchen actually trusts the display now. It changed how we operate." },
  { i: "RV", name: "Rahul Verma",   role: "Tandoor House",     text: "Our peak-hour chaos is gone. Guests order at their own pace, the kitchen sees everything live, and the bill-request feature alone saved us 20 minutes a night." },
];

const FAQS = [
  { q: "Do my guests need to download an app?", a: "No. Guests open a regular browser by scanning the QR code — no download, no account, no friction. Works on any smartphone." },
  { q: "Can I update the menu after printing QR codes?", a: "Yes. The QR code points to your restaurant's live menu. Update prices, availability, or add new items at any time — the printed QR stays valid forever." },
  { q: "What happens if the internet goes down?", a: "The system requires an internet connection to place and receive orders. We recommend a stable WiFi connection at your venue; we provide 99.9% uptime on our end." },
  { q: "Is there a long-term contract?", a: "No. Starter is free forever. Pro and Enterprise are month-to-month — cancel any time from your dashboard with no penalties." },
  { q: "Can I use Cognos across multiple restaurant locations?", a: "Yes. Enterprise accounts support multiple locations with separate menus, table sets, and staff dashboards under one master account." },
  { q: "How do I handle payments?", a: "Cognos tracks billing and records payments by cash or card. Integration with payment gateways (Stripe, local processors) is available on Pro and Enterprise plans." },
];

const MENU_ITEMS = [
  { e: "🍛", name: "Chicken Biryani", price: "Rs. 480" },
  { e: "🫓", name: "Naan Platter",    price: "Rs. 320" },
  { e: "🥗", name: "Garden Salad",   price: "Rs. 220" },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<"admin" | "guest">("admin");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="lp">

      {/* ── Navbar ───────────────────────────────────────────── */}
      <nav className={`lp-nav${scrolled ? " scrolled" : ""}`}>
        <div className="lp-nav-inner">
          <a href="/" className="lp-logo">
            <div className="lp-logo-mark"><i className="ri-restaurant-2-line" /></div>
            <span className="lp-logo-text">COGNOS</span>
          </a>
          <ul className="lp-nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#how-it-works">How It Works</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
          <div className="lp-nav-ctas">
            <a href="/admin" className="lp-nav-login">Log In</a>
            <a href="#pricing" className="lp-nav-trial">Start Free Trial</a>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-glow-a" />
        <div className="lp-hero-glow-b" />
        <div className="lp-hero-pattern" />
        <div className="lp-hero-inner">

          <div>
            <div className="lp-hero-eyebrow">
              <i className="ri-sparkling-2-line" /> Restaurant ordering platform
            </div>
            <h1 className="lp-hero-h1">
              The complete QR ordering<br />system for <em>your restaurant</em>
            </h1>
            <p className="lp-hero-sub">
              Cognos gives your guests a beautiful digital menu experience
              while keeping your kitchen, staff, and front-of-house perfectly
              in sync — set up in minutes, no hardware required.
            </p>
            <div className="lp-hero-actions">
              <a href="#pricing" className="lp-hero-cta-p">
                Start for Free <i className="ri-arrow-right-line" />
              </a>
              <a href="#how-it-works" className="lp-hero-cta-s">
                <i className="ri-play-circle-line" /> See How It Works
              </a>
            </div>
            <div className="lp-hero-trust">
              <span>No credit card required</span>
              <span className="lp-hero-trust-dot" />
              <span>14-day free trial</span>
              <span className="lp-hero-trust-dot" />
              <span>Free forever plan</span>
            </div>
          </div>

          {/* Dual-device mockup */}
          <div className="lp-hero-devices">
            {/* Laptop — Admin Dashboard */}
            <div className="lp-laptop">
              <div className="lp-laptop-body">
                <div className="lp-laptop-screen">
                  <div className="lp-admin-screen">
                    <div className="lp-admin-topbar">
                      <span className="lp-admin-topbar-title">COGNOS ADMIN</span>
                      <div className="lp-admin-topbar-right">
                        <span className="lp-admin-dot" /><span className="lp-admin-dot" /><span className="lp-admin-dot" />
                      </div>
                    </div>
                    <div className="lp-admin-body">
                      <div className="lp-admin-sidebar">
                        {[1,2,3,4].map(n => <div key={n} className={`lp-admin-icon${n===1?" active":""}`} />)}
                      </div>
                      <div className="lp-admin-main">
                        <div className="lp-admin-tables-grid">
                          {[
                            {l:"T01",a:true,s:"Active"},
                            {l:"T02",a:false,s:"Empty"},
                            {l:"T03",a:true,s:"Active"},
                            {l:"T04",a:false,s:"Empty"},
                            {l:"T05",a:true,s:"Active"},
                            {l:"T06",a:false,s:"Empty"},
                            {l:"T07",a:true,s:"Active"},
                            {l:"T08",a:false,s:"Empty"},
                          ].map(t => (
                            <div key={t.l} className={`lp-admin-table-chip${t.a?" active":" empty"}`}>
                              <div className="lp-admin-chip-label">{t.l}</div>
                              <div className={`lp-admin-chip-status${t.a?"":` e`}`}>{t.s}</div>
                            </div>
                          ))}
                        </div>
                        <div className="lp-admin-orders-label">Live Orders</div>
                        <div className="lp-admin-orders">
                          {[
                            {m:"T01 · Biryani",b:"Received",k:false},
                            {m:"T03 · 2 items",b:"Kitchen",k:true},
                            {m:"T05 · Salad",b:"Ready",k:false},
                          ].map(o => (
                            <div key={o.m} className="lp-admin-order-row">
                              <span className="lp-admin-order-meta">{o.m}</span>
                              <span className={`lp-admin-order-badge${o.k?" k":""}`}>{o.b}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lp-laptop-base" />
            </div>

            {/* Phone — Guest ordering */}
            <div className="lp-phone-wrap">
              <div className="lp-phone">
                <div className="lp-phone-screen">
                  <div className="lp-phone-header">
                    <span className="lp-phone-brand">COGNOS</span>
                    <span className="lp-phone-tbadge">Table 03</span>
                  </div>
                  <div className="lp-phone-body">
                    {MENU_ITEMS.map(item => (
                      <div key={item.name} className="lp-phone-item">
                        <div className="lp-phone-item-img">{item.e}</div>
                        <div>
                          <div className="lp-phone-item-name">{item.name}</div>
                          <div className="lp-phone-item-price">{item.price}</div>
                        </div>
                        <button className="lp-phone-add">+</button>
                      </div>
                    ))}
                    <div className="lp-phone-spacer" />
                    <div className="lp-phone-cart">
                      <span className="lp-phone-cart-label">2 items · Rs. 800</span>
                      <button className="lp-phone-cart-btn">Order</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="lp-badge lp-badge-1">
              <div className="lp-badge-icon lp-badge-icon-g"><i className="ri-checkbox-circle-line" /></div>
              <div>
                <div className="lp-badge-title">Order Received</div>
                <div className="lp-badge-sub">Table 3 · 2 items</div>
              </div>
            </div>
            <div className="lp-badge lp-badge-2">
              <div className="lp-badge-icon lp-badge-icon-o"><i className="ri-restaurant-line" /></div>
              <div>
                <div className="lp-badge-title">In Kitchen</div>
                <div className="lp-badge-sub">ETA ~8 minutes</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────── */}
      <section className="lp-stats">
        <div className="lp-container">
          <div className="lp-stats-grid">
            {[
              { n: "500+",   l: "Restaurants Onboarded" },
              { n: "180K+",  l: "Orders Processed" },
              { n: "99.9%",  l: "Platform Uptime" },
              { n: "4.9★",   l: "Average Rating" },
            ].map(s => (
              <div key={s.l} className="lp-stat">
                <div className="lp-stat-number">{s.n}</div>
                <div className="lp-stat-label">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem / Solution ───────────────────────────────── */}
      <section className="lp-ps">
        <div className="lp-container">
          <div className="lp-section-center" style={{ marginBottom: 48 }}>
            <span className="lp-section-label">Why Cognos</span>
            <h2 className="lp-section-h2">Running a restaurant is hard enough</h2>
            <p className="lp-section-sub" style={{ margin: "0 auto" }}>
              The old tools weren't built for modern dining. Cognos was.
            </p>
          </div>
          <div className="lp-ps-grid">
            <div className="lp-ps-col lp-ps-col-old">
              <div className="lp-ps-col-heading">The Old Way</div>
              <div className="lp-ps-items">
                {[
                  "Handwritten orders get lost or misread",
                  "Waitstaff constantly relay between tables and kitchen",
                  "Guests wait to flag someone down for the bill",
                  "No visibility into what's selling or when it's busy",
                  "Replacing paper menus costs money every time prices change",
                ].map(t => (
                  <div key={t} className="lp-ps-item">
                    <div className="lp-ps-item-icon"><i className="ri-close-line" /></div>
                    <span className="lp-ps-item-text">{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="lp-ps-col lp-ps-col-new">
              <div className="lp-ps-col-heading">The Cognos Way</div>
              <div className="lp-ps-items">
                {[
                  "Guests order directly from their phone — zero errors",
                  "Orders appear on the kitchen display the second they're placed",
                  "One-tap bill request notifies staff instantly",
                  "Live analytics show revenue, top items, and peak hours",
                  "Update your menu in seconds — no reprinting ever",
                ].map(t => (
                  <div key={t} className="lp-ps-item">
                    <div className="lp-ps-item-icon"><i className="ri-check-line" /></div>
                    <span className="lp-ps-item-text">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section id="features" className="lp-features">
        <div className="lp-container">
          <div className="lp-section-center">
            <span className="lp-section-label">What You Get</span>
            <h2 className="lp-section-h2">Everything your restaurant needs,<br />nothing it doesn't</h2>
            <p className="lp-section-sub">
              From the first QR scan to the final bill — Cognos handles every touchpoint, for both your guests and your team.
            </p>
          </div>
          <div className="lp-features-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="lp-feat">
                <div className="lp-feat-icon"><i className={f.icon} /></div>
                <h3 className="lp-feat-title">{f.title}</h3>
                <p className="lp-feat-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Onboarding Steps ─────────────────────────────────── */}
      <section id="how-it-works" className="lp-how">
        <div className="lp-how-pat" />
        <div className="lp-container" style={{ position: "relative" }}>
          <div className="lp-section-center">
            <span className="lp-section-label">Getting Started</span>
            <h2 className="lp-section-h2">Your restaurant, live in minutes</h2>
            <p className="lp-section-sub">
              No hardware to install, no developer needed. If you can fill in a form, you can run Cognos.
            </p>
          </div>
          <div className="lp-steps">
            {STEPS.map(s => (
              <div key={s.n} className="lp-step">
                <div className="lp-step-num">{s.n}</div>
                <h3 className="lp-step-title">{s.title}</h3>
                <p className="lp-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platform Preview ─────────────────────────────────── */}
      <section className="lp-preview">
        <div className="lp-container">
          <div className="lp-section-center">
            <span className="lp-section-label">See It in Action</span>
            <h2 className="lp-section-h2">Two interfaces, one platform</h2>
            <p className="lp-section-sub">
              Cognos powers both sides of the experience — the restaurant's admin dashboard and your guests' ordering flow.
            </p>
          </div>
          <div className="lp-preview-tabs">
            <button className={`lp-preview-tab${activeTab === "admin" ? " active" : ""}`} onClick={() => setActiveTab("admin")}>
              Admin Dashboard
            </button>
            <button className={`lp-preview-tab${activeTab === "guest" ? " active" : ""}`} onClick={() => setActiveTab("guest")}>
              Guest Ordering
            </button>
          </div>
          <div className="lp-preview-frame">
            <div className="lp-preview-browser-bar">
              <div className="lp-browser-dots">
                <span className="lp-browser-dot" /><span className="lp-browser-dot" /><span className="lp-browser-dot" />
              </div>
              <div className="lp-browser-url">
                {activeTab === "admin" ? "cognos.app/admin" : "cognos.app/dine?t=a3f9b2c1"}
              </div>
            </div>
            <div className="lp-preview-content">

              {/* Admin pane */}
              <div className={`lp-preview-pane${activeTab === "admin" ? " active" : ""}`}>
                <div className="lp-admin-preview">
                  <div className="lp-admin-preview-row">
                    {[
                      { l: "Tables Active", v: "6", s: "of 12 total" },
                      { l: "Orders Today",  v: "47", s: "+12 vs yesterday" },
                      { l: "Revenue",       v: "₨ 38K", s: "today so far" },
                      { l: "Alerts",        v: "2",  s: "pending" },
                    ].map(c => (
                      <div key={c.l} className="lp-admin-preview-card">
                        <div className="lp-apc-label">{c.l}</div>
                        <div className="lp-apc-value">{c.v}</div>
                        <div className="lp-apc-sub">{c.s}</div>
                      </div>
                    ))}
                  </div>
                  <div className="lp-admin-preview-orders">
                    {[
                      { info: "T01 · Chicken Biryani, Naan",  badge: "Received", cls: "lp-apo-badge-r" },
                      { info: "T03 · Garden Salad, Kebabs",   badge: "Kitchen",  cls: "lp-apo-badge-k" },
                      { info: "T07 · Lassi, Gulab Jamun",     badge: "Ready",    cls: "lp-apo-badge-s" },
                    ].map(o => (
                      <div key={o.info} className="lp-apo-row">
                        <span className="lp-apo-info">{o.info}</span>
                        <span className={`lp-apo-badge ${o.cls}`}>{o.badge}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Guest pane */}
              <div className={`lp-preview-pane${activeTab === "guest" ? " active" : ""}`}>
                <div className="lp-guest-preview">
                  <div className="lp-guest-phone-lg">
                    <div className="lp-guest-phone-header">
                      <span className="lp-guest-brand">COGNOS</span>
                      <span className="lp-guest-tbadge">Table 07</span>
                    </div>
                    <div className="lp-guest-body">
                      {MENU_ITEMS.map(item => (
                        <div key={item.name} className="lp-guest-item">
                          <div className="lp-guest-item-img">{item.e}</div>
                          <div>
                            <div className="lp-guest-item-name">{item.name}</div>
                            <div className="lp-guest-item-price">{item.price}</div>
                          </div>
                          <button className="lp-guest-add">+</button>
                        </div>
                      ))}
                      <div className="lp-guest-cart">
                        <span className="lp-guest-cart-label">2 items · Rs. 800</span>
                        <button className="lp-guest-cart-btn">Place Order</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section className="lp-testi">
        <div className="lp-container">
          <div className="lp-section-center">
            <span className="lp-section-label">From Our Customers</span>
            <h2 className="lp-section-h2">Restaurants that made the switch</h2>
          </div>
          <div className="lp-testi-grid">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="lp-testi-card">
                <div className="lp-testi-stars">{[1,2,3,4,5].map(i=><i key={i} className="ri-star-fill" />)}</div>
                <div className="lp-testi-quote">"</div>
                <p className="lp-testi-text">{t.text}</p>
                <div className="lp-testi-author">
                  <div className="lp-testi-av">{t.i}</div>
                  <div>
                    <div className="lp-testi-name">{t.name}</div>
                    <div className="lp-testi-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section id="pricing" className="lp-pricing">
        <div className="lp-container">
          <div className="lp-section-center">
            <span className="lp-section-label">Pricing</span>
            <h2 className="lp-section-h2">Simple pricing for every restaurant</h2>
            <p className="lp-section-sub">No hidden fees. No long-term contracts. Upgrade or cancel any time.</p>
          </div>
          <div className="lp-pricing-grid">

            <div className="lp-price-card">
              <span className="lp-price-tier">Starter</span>
              <div><span className="lp-price-amount">Free</span></div>
              <p className="lp-price-desc">For small cafés and pop-ups just getting started with digital ordering.</p>
              <ul className="lp-price-feats">
                {["1 location · up to 5 tables","Full QR ordering flow","Basic kitchen dashboard","Waiter & bill alerts","Email support"].map(f=>(
                  <li key={f} className="lp-price-feat"><i className="ri-check-line" />{f}</li>
                ))}
              </ul>
              <a href="/admin" className="lp-price-btn lp-price-btn-out">Get Started Free</a>
            </div>

            <div className="lp-price-card featured">
              <span className="lp-price-tier">Growth</span>
              <div><span className="lp-price-amount">$49</span><span className="lp-price-period"> / month</span></div>
              <p className="lp-price-desc">For growing restaurants that need unlimited scale, analytics, and custom branding.</p>
              <ul className="lp-price-feats">
                {["Unlimited tables","Full revenue analytics","Customer profiles & history","Custom branding","Priority support","Everything in Starter"].map(f=>(
                  <li key={f} className="lp-price-feat"><i className="ri-check-line" />{f}</li>
                ))}
              </ul>
              <a href="/admin" className="lp-price-btn lp-price-btn-main">Start 14-Day Trial</a>
            </div>

            <div className="lp-price-card">
              <span className="lp-price-tier">Enterprise</span>
              <div><span className="lp-price-amount">Custom</span></div>
              <p className="lp-price-desc">For chains and franchise groups managing multiple locations under one account.</p>
              <ul className="lp-price-feats">
                {["Multi-location support","Dedicated account manager","White-label option","Custom integrations & API","SLA guarantee","Everything in Growth"].map(f=>(
                  <li key={f} className="lp-price-feat"><i className="ri-check-line" />{f}</li>
                ))}
              </ul>
              <a href="mailto:hello@cognos.app" className="lp-price-btn lp-price-btn-out">Contact Sales</a>
            </div>

          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section id="faq" className="lp-faq">
        <div className="lp-container">
          <div className="lp-section-center">
            <span className="lp-section-label">FAQ</span>
            <h2 className="lp-section-h2">Common questions</h2>
          </div>
          <div className="lp-faq-list">
            {FAQS.map((faq, idx) => (
              <div key={idx} className={`lp-faq-item${openFaq === idx ? " open" : ""}`}>
                <button className="lp-faq-q" onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
                  {faq.q}
                  <i className="ri-add-line" />
                </button>
                <div className="lp-faq-a">{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────── */}
      <section className="lp-cta">
        <div className="lp-cta-glow" />
        <div className="lp-container" style={{ position: "relative" }}>
          <h2 className="lp-cta-h2">Ready to modernise<br />your restaurant?</h2>
          <p className="lp-cta-sub">
            Join 500+ restaurants using Cognos to deliver a faster, smarter, and more profitable dining experience.
          </p>
          <a href="/admin" className="lp-cta-btn">
            Start for Free <i className="ri-arrow-right-line" />
          </a>
          <p className="lp-cta-note">No credit card required · Takes less than 10 minutes to set up</p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-top">
            <div>
              <div className="lp-footer-name">COGNOS</div>
              <p className="lp-footer-tagline">
                The QR-based restaurant ordering platform built for modern hospitality.
              </p>
            </div>
            <div>
              <div className="lp-footer-col-h">Product</div>
              <ul className="lp-footer-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#how-it-works">How It Works</a></li>
                <li><a href="/admin">Admin Dashboard</a></li>
              </ul>
            </div>
            <div>
              <div className="lp-footer-col-h">Company</div>
              <ul className="lp-footer-links">
                <li><a href="#">About</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Press</a></li>
              </ul>
            </div>
            <div>
              <div className="lp-footer-col-h">Support</div>
              <ul className="lp-footer-links">
                <li><a href="#">Documentation</a></li>
                <li><a href="#">API Reference</a></li>
                <li><a href="#">Status</a></li>
                <li><a href="mailto:hello@cognos.app">hello@cognos.app</a></li>
              </ul>
            </div>
          </div>
          <div className="lp-footer-btm">
            <p className="lp-footer-copy">© 2026 Cognos. All rights reserved.</p>
            <div className="lp-footer-legal">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}