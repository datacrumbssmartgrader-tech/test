import Link from "next/link";

export default function Specials() {
  const specials = [
    {
      icon: "ri-moon-line",
      badge: "Weekend Only",
      badgeClass: "",
      title: "Weekend Feast",
      desc: "Every Friday & Saturday — enjoy our 5-course Mughal Banquet for two. Includes unlimited Kashmiri Chai and one dessert each.",
      price: "PKR 6,500",
      priceSuffix: "for 2",
      btnText: "Reserve Now",
      btnClass: "btn-gold-sm",
      featured: false,
      delay: "0s"
    },
    {
      icon: "ri-star-line",
      badge: "Chef's Seasonal",
      badgeClass: "gold",
      title: "Saffron Raan",
      desc: "This month only — whole roasted leg of lamb in saffron, dry fruits and royal spices. Pre-booking only, serves 4–6 guests.",
      price: "PKR 8,500",
      priceSuffix: "",
      btnText: "Pre-order",
      btnClass: "btn-primary-sm",
      featured: true,
      delay: "0.12s"
    },
    {
      icon: "ri-gift-line",
      badge: "Occasion",
      badgeClass: "",
      title: "Celebration Package",
      desc: "Birthday, anniversary or corporate dinner — let us curate a custom menu. Complimentary cake, dedicated waiter and floral arrangement.",
      price: "From PKR 2,500",
      priceSuffix: "per head",
      btnText: "Enquire",
      btnClass: "btn-gold-sm",
      featured: false,
      delay: "0.24s"
    }
  ];

  return (
    <section id="specials" className="section specials">
      <div className="section-bg-dark" aria-hidden="true"></div>
      <div className="container">
        <div className="section-header centered">
          <span className="section-tag light">Limited Time</span>
          <h2 className="section-title light">Specials &amp; Offers</h2>
          <div className="gold-rule center"></div>
        </div>
        <div className="specials-grid">
          {specials.map((sp, idx) => (
            <div 
              key={idx} 
              className={`special-card reveal-up ${sp.featured ? "featured" : ""}`}
              style={{ "--reveal-delay": sp.delay } as React.CSSProperties}
            >
              <div className="special-icon"><i className={sp.icon}></i></div>
              <span className={`special-badge ${sp.badgeClass}`}>{sp.badge}</span>
              <h3>{sp.title}</h3>
              <p>{sp.desc}</p>
              <p className="special-price">
                {sp.price} {sp.priceSuffix && <span>{sp.priceSuffix}</span>}
              </p>
              <Link href="#reserve" className={sp.btnClass}>{sp.btnText}</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
