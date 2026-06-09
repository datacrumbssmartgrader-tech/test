"use client";

import { useState } from "react";

export default function ReservationForm() {
  const [step, setStep] = useState<"form" | "payment" | "success">("form");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fname: "", fphone: "", fdate: "", ftime: "", fguests: "", foccasion: "", fnotes: ""
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Card state
  const [cardData, setCardData] = useState({ num: "", expiry: "", cvv: "", name: "" });
  const [cardNetwork, setCardNetwork] = useState("");
  const [cardErrors, setCardErrors] = useState<Record<string, boolean>>({});

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
    const errors: Record<string, string> = {};

    if (!formData.fname.trim()) { errors.fname = "Full name is required"; valid = false; }
    if (!formData.fphone.trim()) { errors.fphone = "Phone number is required"; valid = false; }
    if (!formData.fdate) { errors.fdate = "Date is required"; valid = false; }
    else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(formData.fdate) < today) {
        errors.fdate = "Please select a future date";
        valid = false;
      }
    }
    if (!formData.ftime) { errors.ftime = "Time is required"; valid = false; }
    if (!formData.fguests) { errors.fguests = "Number of guests is required"; valid = false; }

    if (!valid) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep("payment");
    }, 1200);
  };

  const handleCardNum = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 16);
    const prefix = v.slice(0, 2);
    if (v[0] === '4') setCardNetwork('VISA');
    else if (['51','52','53','54','55'].includes(prefix)) setCardNetwork('MC');
    else if (['34','37'].includes(prefix)) setCardNetwork('AMEX');
    else setCardNetwork('');
    
    v = v.replace(/(.{4})/g, '$1 ').trim();
    setCardData(prev => ({ ...prev, num: v }));
    setCardErrors(prev => ({ ...prev, num: false }));
  };

  const handleCardExpiry = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + ' / ' + v.slice(2);
    setCardData(prev => ({ ...prev, expiry: v }));
    setCardErrors(prev => ({ ...prev, expiry: false }));
  };

  const handleCardCvv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 3);
    setCardData(prev => ({ ...prev, cvv: v }));
    setCardErrors(prev => ({ ...prev, cvv: false }));
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
    const errors: Record<string, boolean> = {};

    if (!cardData.num.trim()) { errors.num = true; valid = false; }
    if (!cardData.expiry.trim()) { errors.expiry = true; valid = false; }
    if (!cardData.cvv.trim()) { errors.cvv = true; valid = false; }
    if (!cardData.name.trim()) { errors.name = true; valid = false; }

    if (!valid) {
      setCardErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setPaymentSuccess(true);
      setStep("success");
    }, 1800);
  };

  return (
    <section id="reserve" className="section reserve">
      <div className="container">
        <div className="reserve-grid">
          <div className="reserve-info reveal-left">
            <span className="section-tag">Book Your Table</span>
            <h2 className="section-title">Reserve a<br />Dining Experience</h2>
            <div className="gold-rule"></div>
            <p>Every meal at Rooster&apos;s Den is crafted with care and intention. Reserve your table to ensure we can prepare the finest experience for your occasion.</p>
            <div className="reserve-contact-list">
              <div className="r-contact">
                <i className="ri-time-line"></i>
                <div>
                  <strong>Opening Hours</strong>
                  <span>Mon–Thu: 12pm – 11pm</span>
                  <span>Fri–Sun: 12pm – 12am</span>
                </div>
              </div>
              <div className="r-contact">
                <i className="ri-whatsapp-line"></i>
                <div>
                  <strong>WhatsApp / Phone</strong>
                  <span>+92 300 123 4567</span>
                </div>
              </div>
              <div className="r-contact">
                <i className="ri-map-pin-line"></i>
                <div>
                  <strong>Location</strong>
                  <span>123 Gulberg III, Lahore</span>
                </div>
              </div>
            </div>
          </div>

          <div className="reserve-form-wrap reveal-right">
            {step === "form" && (
              <form className="reserve-form" id="reserveForm" onSubmit={handleFormSubmit} noValidate>
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="fname">Full Name</label>
                    <input type="text" id="fname" name="fname" placeholder="Your name" value={formData.fname} onChange={handleFormChange} />
                    <span className="field-err">{formErrors.fname}</span>
                  </div>
                  <div className="form-field">
                    <label htmlFor="fphone">Phone Number</label>
                    <input type="tel" id="fphone" name="fphone" placeholder="+92 3XX XXXXXXX" value={formData.fphone} onChange={handleFormChange} />
                    <span className="field-err">{formErrors.fphone}</span>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="fdate">Date</label>
                    <input type="date" id="fdate" name="fdate" value={formData.fdate} min={new Date().toISOString().split('T')[0]} onChange={handleFormChange} />
                    <span className="field-err">{formErrors.fdate}</span>
                  </div>
                  <div className="form-field">
                    <label htmlFor="ftime">Preferred Time</label>
                    <select id="ftime" name="ftime" value={formData.ftime} onChange={handleFormChange}>
                      <option value="">Select time</option>
                      <option>12:00 PM</option><option>1:00 PM</option>
                      <option>2:00 PM</option><option>3:00 PM</option>
                      <option>7:00 PM</option><option>8:00 PM</option>
                      <option>9:00 PM</option><option>10:00 PM</option>
                    </select>
                    <span className="field-err">{formErrors.ftime}</span>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="fguests">Number of Guests</label>
                    <select id="fguests" name="fguests" value={formData.fguests} onChange={handleFormChange}>
                      <option value="">Select</option>
                      <option>1 Guest</option><option>2 Guests</option>
                      <option>3 Guests</option><option>4 Guests</option>
                      <option>5–6 Guests</option><option>7–10 Guests</option>
                      <option>10+ Guests</option>
                    </select>
                    <span className="field-err">{formErrors.fguests}</span>
                  </div>
                  <div className="form-field">
                    <label htmlFor="foccasion">Occasion <span className="opt">(Optional)</span></label>
                    <select id="foccasion" name="foccasion" value={formData.foccasion} onChange={handleFormChange}>
                      <option value="">Select</option>
                      <option>Birthday</option><option>Anniversary</option>
                      <option>Business Dinner</option><option>Family Gathering</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-field full">
                  <label htmlFor="fnotes">Special Requests <span className="opt">(Optional)</span></label>
                  <textarea id="fnotes" name="fnotes" rows={3} placeholder="Dietary requirements, seating preferences, special arrangements..." value={formData.fnotes} onChange={handleFormChange}></textarea>
                </div>
                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? <span>Sending...</span> : (
                    <>
                      <span>Request Reservation</span>
                      <i className="ri-send-plane-line"></i>
                    </>
                  )}
                </button>
              </form>
            )}

            {step === "payment" && (
              <div className="payment-step visible" id="paymentStep">
                <div className="payment-confirmed">
                  <i className="ri-checkbox-circle-line"></i>
                  <h3>Reservation Received!</h3>
                  <p>We&apos;ll confirm via WhatsApp within 2 hours.</p>
                </div>
                <div className="payment-deposit-card">
                  <div className="deposit-header">
                    <div>
                      <p className="deposit-label">Optional: Secure Your Table</p>
                      <h4 className="deposit-amount">PKR 1,000 <span>deposit</span></h4>
                    </div>
                    <span className="deposit-badge"><i className="ri-shield-check-line"></i> Stripe</span>
                  </div>
                  <p className="deposit-note">Fully refundable if cancelled 48 hrs before your booking. Deducted from your final bill.</p>
                  <form className="card-form" onSubmit={handleCardSubmit} noValidate>
                    <div className="card-field-wrap">
                      <label className="card-label">Card Number</label>
                      <div className="card-input-wrap">
                        <i className="ri-bank-card-line card-icon"></i>
                        <input type="text" className={`card-input ${cardErrors.num ? "error" : ""}`} placeholder="1234 5678 9012 3456" value={cardData.num} onChange={handleCardNum} />
                        <span className="card-network">{cardNetwork}</span>
                      </div>
                    </div>
                    <div className="card-row">
                      <div className="card-field-wrap">
                        <label className="card-label">Expiry</label>
                        <input type="text" className={`card-input ${cardErrors.expiry ? "error" : ""}`} placeholder="MM / YY" value={cardData.expiry} onChange={handleCardExpiry} />
                      </div>
                      <div className="card-field-wrap">
                        <label className="card-label">CVV</label>
                        <div className="card-input-wrap">
                          <input type="text" className={`card-input ${cardErrors.cvv ? "error" : ""}`} placeholder="•••" value={cardData.cvv} onChange={handleCardCvv} />
                          <i className="ri-question-line card-cvv-hint" title="3 digits on the back of your card"></i>
                        </div>
                      </div>
                    </div>
                    <div className="card-field-wrap">
                      <label className="card-label">Cardholder Name</label>
                      <input type="text" className={`card-input ${cardErrors.name ? "error" : ""}`} placeholder="Name as on card" value={cardData.name} onChange={(e) => {
                        setCardData(prev => ({ ...prev, name: e.target.value }));
                        setCardErrors(prev => ({ ...prev, name: false }));
                      }} />
                    </div>
                    <button type="submit" className={`btn-pay ${isSubmitting ? "processing" : ""}`} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <><i className="ri-loader-4-line"></i> Processing…</>
                      ) : (
                        <><i className="ri-lock-2-line"></i> Pay PKR 1,000 Securely</>
                      )}
                    </button>
                  </form>
                  <button className="btn-skip" onClick={() => { setPaymentSuccess(false); setStep("success"); }}>
                    Skip — I&apos;ll pay at the venue
                  </button>
                </div>
              </div>
            )}

            {step === "success" && (
              <div className="form-success" style={{ display: "block" }}>
                <i className="ri-checkbox-circle-line"></i>
                <h3>You&apos;re All Set!</h3>
                <p>
                  {paymentSuccess 
                    ? "Your PKR 1,000 deposit has been received. See you soon!" 
                    : "We'll confirm your booking via WhatsApp or phone within 2 hours."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
