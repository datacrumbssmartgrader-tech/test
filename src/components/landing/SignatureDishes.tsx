import Link from "next/link";

export default function SignatureDishes() {
  const signatureItems = [
    {
      title: "Sindhi Mutton Biryani",
      category: "Biryani & Rice",
      description: "A regal layered biryani, slow-cooked with marinated mutton, saffron-infused basmati and whole Mughal spices. Served with raita and salad.",
      price: "PKR 1,800",
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=700&q=80",
      badge: "Chef's Pick",
      delay: "0s"
    },
    {
      title: "Barra Lamb Chops",
      category: "Signature Grills",
      description: "Baby lamb chops marinated for 24 hours in raw papaya, yoghurt and aromatic spices. Char-grilled to perfection in our clay tandoor.",
      price: "PKR 2,800",
      image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=700&q=80",
      badge: "Most Loved",
      delay: "0.15s"
    },
    {
      title: "Mutton Karahi",
      category: "Karahi & Curries",
      description: "Slow-braised mutton shoulder cooked in a traditional iron karahi with fresh tomatoes, green chillies and hand-ground garam masala.",
      price: "PKR 2,200",
      image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=700&q=80",
      badge: "Seasonal",
      delay: "0.3s"
    }
  ];

  return (
    <section id="signature" className="section signature">
      <div className="section-bg-pattern" aria-hidden="true"></div>
      <div className="container">
        <div className="section-header centered">
          <span className="section-tag">Chef&apos;s Selection</span>
          <h2 className="section-title">Signature Dishes</h2>
          <div className="gold-rule center"></div>
        </div>
        <div className="sig-grid">
          {signatureItems.map((item, index) => (
            <div 
              key={index} 
              className="sig-card reveal-up" 
              style={{ "--reveal-delay": item.delay } as React.CSSProperties}
            >
              <div className="sig-img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.title} loading="lazy" />
                <span className="sig-badge">{item.badge}</span>
              </div>
              <div className="sig-body">
                <span className="sig-cat">{item.category}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <div className="sig-foot">
                  <span className="sig-price">{item.price}</span>
                  <Link href="#menu" className="sig-link">View in Menu <i className="ri-arrow-right-line"></i></Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
