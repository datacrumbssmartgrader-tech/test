"use client"
import React, { useState } from "react"
import { useAuth } from "@/lib/useAuth"

export default function LoginScreen({ onLogin }: { onLogin?: () => void }) {
  const { login, isLoading } = useAuth()
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (pin.length !== 4) {
      setError("Enter 4-digit PIN")
      return
    }

    try {
      setError("")
      await login(pin)
      onLogin && onLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed")
    }
  }

  return (
    <div id="login-screen">
      <div className="login-bg"></div>
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-logo">
          <span className="login-logo-en">AI-RESTAURANT</span>
        </div>
        <p className="login-subtitle">Staff Access</p>

        <div className="pin-field">
          <label className="pin-label">PIN</label>
          <input id="pin-input" type="password" inputMode="numeric" maxLength={4}
            placeholder="• • • •" autoComplete="off" value={pin}
            disabled={isLoading}
            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))} />
        </div>

        <button id="btn-login" className="login-btn" type="submit" disabled={isLoading}>
          <i className="ri-login-circle-line"></i> {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
        {error && <p id="login-error" className="login-error">{error}</p>}
      </form>
    </div>
  )
}
