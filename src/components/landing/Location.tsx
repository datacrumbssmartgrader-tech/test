export default function Location() {
  return (
    <section id="location" className="section location">
      <div className="container">
        <div className="location-grid">
          <div className="location-info reveal-left">
            <span className="section-tag">Find Us</span>
            <h2 className="section-title">Where to<br />Find Rooster&apos;s Den</h2>
            <div className="gold-rule"></div>
            <address>
              <i className="ri-map-pin-2-line"></i>
              123 Gulberg III, Main Boulevard,<br />Lahore, Punjab, Pakistan
            </address>
            <table className="hours-table">
              <tbody>
                <tr><td>Monday – Thursday</td><td>12:00 PM – 11:00 PM</td></tr>
                <tr><td>Friday – Saturday</td><td>12:00 PM – 12:00 AM</td></tr>
                <tr><td>Sunday</td><td>1:00 PM – 10:00 PM</td></tr>
              </tbody>
            </table>
            <div className="loc-actions">
              <a href="https://wa.me/923001234567" className="btn-primary" target="_blank" rel="noopener noreferrer">
                <i className="ri-whatsapp-line"></i> WhatsApp Us
              </a>
              <a href="tel:+923001234567" className="btn-outline">
                <i className="ri-phone-line"></i> Call Us
              </a>
            </div>
          </div>
          <div className="location-map reveal-right">
            <div className="map-shell">
              <div className="map-pin-icon"><i className="ri-map-pin-fill"></i></div>
              <p className="map-label">Gulberg III, Lahore</p>
              <a href="https://maps.google.com/?q=Gulberg+III+Lahore" className="btn-outline-sm" target="_blank" rel="noopener noreferrer">
                Open in Google Maps <i className="ri-external-link-line"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
