"use client";

import React from "react";
import styles from "./WelcomeScreen.module.css";

interface WelcomeScreenProps {
  tableNumber: string;
  onBrowseMenu: () => void;
  onCallWaiter: () => void;
}

export default function WelcomeScreen({ tableNumber, onBrowseMenu, onCallWaiter }: WelcomeScreenProps) {
  return (
    <div className={styles.screen}>
      <div className={styles.spacer}></div>
      <div className={styles.foreground}>
        <h1 className={styles.heading}>ROOSTER&apos;S DEN</h1>
        <div className={styles.actions}>
          <span className={styles.badge}>
            Table: <span>{tableNumber || "—"}</span>
          </span>
          <div className={styles.rowMenu}>
            <button className={`${styles.btn} ${styles.btnMenu}`} onClick={onBrowseMenu}>
              Menu
            </button>
            <button className={`${styles.btn} ${styles.btnWaiter}`} onClick={onCallWaiter}>
              Call Waiter
            </button>
          </div>
        </div>
      </div>
      <div className={styles.spacer}></div>
    </div>
  );
}
