"use client";
import React from "react";

interface AdminTopbarProps {
  title: string;
  onMenuOpen: () => void;
  user: { name: string } | null;
}

export default function AdminTopbar({ title, onMenuOpen, user }: AdminTopbarProps) {
  const initial = user?.name?.[0]?.toUpperCase() ?? "A";
  return (
    <header id="topbar">
      <button id="btn-hamburger" aria-label="Open menu" onClick={onMenuOpen}>
        <i className="ri-menu-line"></i>
      </button>
      <span className="topbar-title" id="topbar-title">{title}</span>
      <div className="topbar-user">
        <div className="topbar-avatar" id="topbar-avatar">{initial}</div>
      </div>
    </header>
  );
}
