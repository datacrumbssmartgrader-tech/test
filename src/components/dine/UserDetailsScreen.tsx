"use client";

import React, { useState } from "react";
import styles from "./UserDetailsScreen.module.css";

interface UserDetailsScreenProps {
  onSubmit: (details: { name: string; email: string; phone: string }) => void;
}

export default function UserDetailsScreen({ onSubmit }: UserDetailsScreenProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!name.trim() || !phone.trim()) {
      setError("Name and Phone are required.");
      return;
    }
    setError("");
    onSubmit({ name: name.trim(), email: email.trim(), phone: phone.trim() });
  };

  return (
    <div className={styles.screen}>
      <div className={styles.foreground}>
        <h2 className={styles.title}>Welcome!</h2>
        <p className={styles.subtitle}>Please enter your details to proceed.</p>

        <div className={styles.formGroup}>
          <div className={styles.inputGroup}>
            <label htmlFor="ud-name" className={styles.label}>Full Name</label>
            <input
              type="text"
              id="ud-name"
              placeholder="John Doe"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="ud-email" className={styles.label}>Email</label>
            <input
              type="email"
              id="ud-email"
              placeholder="john@example.com"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="ud-phone" className={styles.label}>Phone Number</label>
            <input
              type="tel"
              id="ud-phone"
              placeholder="+92 300 1234567"
              className={styles.input}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button onClick={handleSubmit} className={styles.button}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
