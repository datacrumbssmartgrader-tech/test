"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import type { OrderBatch } from "@/components/dine/OrderTracker";
import * as api from "@/lib/api";

export function useBilling(orders: OrderBatch[], sessionId: string | null) {
  const [currentBillingRound, setCurrentBillingRound] = useState(1);
  const [paidRounds, setPaidRounds] = useState<Set<number>>(new Set());
  const [hasRequestedBill, setHasRequestedBill] = useState(false);

  // Restore paid-round state from DB on mount (survives page refresh)
  useEffect(() => {
    if (!sessionId) return;
    api.getSessionPayments(sessionId).then((res) => {
      if (res.status !== 200 || !res.data) return;
      const rounds = new Set(res.data.map((p) => p.billing_round));
      setPaidRounds(rounds);
      const maxRound = Math.max(0, ...rounds);
      setCurrentBillingRound(maxRound + 1);
    });
  }, [sessionId]);

  const onPaymentSuccess = () => {
    const newPaidRounds = new Set(paidRounds);
    orders.forEach((b) => newPaidRounds.add(b.billingRound));
    setPaidRounds(newPaidRounds);
    setCurrentBillingRound((prev) => prev + 1);
  };

  // Called when a payment:received SSE event arrives from the server
  const applyPaymentReceived = useCallback((billingRound: number) => {
    setPaidRounds((prev) => new Set([...prev, billingRound]));
    setCurrentBillingRound((prev) => Math.max(prev, billingRound + 1));
  }, []);

  const unpaidOrders = useMemo(
    () => orders.filter((b) => !paidRounds.has(b.billingRound)),
    [orders, paidRounds]
  );

  const amountDue = useMemo(
    () => unpaidOrders.reduce((sum, b) => sum + b.total, 0),
    [unpaidOrders]
  );

  return {
    currentBillingRound,
    paidRounds,
    hasRequestedBill,
    setHasRequestedBill,
    onPaymentSuccess,
    applyPaymentReceived,
    unpaidOrders,
    amountDue,
  };
}
