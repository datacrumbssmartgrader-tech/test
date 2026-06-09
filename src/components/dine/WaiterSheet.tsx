"use client";

import { useState, useEffect } from "react";
import * as api from "@/lib/api";

interface WaiterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitAlert: (msg: string, isComplaint: boolean) => void;
  sessionId: string | null;
  tableId: string | null;
}

export default function WaiterSheet({ isOpen, onClose, onSubmitAlert, sessionId, tableId }: WaiterSheetProps) {
  const [showComplaint, setShowComplaint] = useState(false);
  const [complaintMsg, setComplaintMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowComplaint(false);
      setComplaintMsg("");
      setIsSubmitting(false);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleCallWaiter = async () => {
    setIsSubmitting(true);
    try {
      if (tableId) {
        console.log('[WaiterSheet] Calling waiter — tableId:', tableId, 'sessionId:', sessionId);
        const res = await api.createAlert(tableId, "waiter", "Customer requested waiter assistance", sessionId);
        console.log('[WaiterSheet] createAlert response:', res.status, res.data, res.error);
      } else {
        console.warn('[WaiterSheet] No tableId — alert not sent');
      }
    } catch (err) {
      console.error('[WaiterSheet] createAlert threw:', err);
    } finally {
      setIsSubmitting(false);
      onSubmitAlert("", false);
    }
  };

  const handleSubmitComplaint = async () => {
    if (!complaintMsg.trim()) return;
    setIsSubmitting(true);
    try {
      if (tableId) {
        console.log('[WaiterSheet] Filing complaint — tableId:', tableId, 'sessionId:', sessionId);
        const res = await api.createAlert(tableId, "complaint", complaintMsg.trim(), sessionId);
        console.log('[WaiterSheet] complaint alert response:', res.status, res.data, res.error);
      } else {
        console.warn('[WaiterSheet] No tableId — complaint not sent');
      }
    } catch (err) {
      console.error('[WaiterSheet] complaint threw:', err);
    } finally {
      setIsSubmitting(false);
      onSubmitAlert(complaintMsg, true);
    }
  };

  return (
    <>
      <div className={`sheet-backdrop ${isOpen ? "open" : ""}`} onClick={onClose}></div>
      <div className={`bottom-sheet waiter-sheet ${isOpen ? "open" : ""}`} role="dialog" aria-modal="true">
        <div className="sheet-handle"></div>
        <div className="waiter-body">
          <div className="waiter-icon"><i className="ri-service-line"></i></div>
          <h3 className="waiter-title">At Your Service</h3>
          <p className="waiter-sub" style={{ marginBottom: "1.5rem" }}>How can we help you today?</p>

          {!showComplaint ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
              <button className="btn-primary btn-full" onClick={handleCallWaiter} disabled={isSubmitting}>
                {isSubmitting
                  ? <><i className="ri-loader-4-line" /> Calling...</>
                  : "Call Waiter"}
              </button>
              <button className="btn-ghost btn-full" onClick={() => setShowComplaint(true)} disabled={isSubmitting}>
                File a Complaint
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem", textAlign: "left" }}>
              <textarea
                className="form-input"
                placeholder="Enter your complaint or request here..."
                value={complaintMsg}
                onChange={(e) => setComplaintMsg(e.target.value)}
                rows={3}
              ></textarea>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className="btn-ghost btn-full"
                  style={{ flex: 1 }}
                  onClick={() => setShowComplaint(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary btn-full"
                  style={{ flex: 1 }}
                  onClick={handleSubmitComplaint}
                  disabled={isSubmitting || !complaintMsg.trim()}
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          )}
        </div>
        <div style={{ height: "10dvh", flexShrink: 0 }}></div>
      </div>
    </>
  );
}
