"use client";

import { useState, useMemo } from "react";
import type { OrderBatch } from "@/components/dine/OrderTracker";

export function useBilling(orders: OrderBatch[]) {
  const [currentBillingRound, setCurrentBillingRound] = useState(1);
  const [paidRounds, setPaidRounds] = useState<Set<number>>(new Set());
  const [hasRequestedBill, setHasRequestedBill] = useState(false);

  const onPaymentSuccess = () => {
    const newPaidRounds = new Set(paidRounds);
    orders.forEach((b) => newPaidRounds.add(b.billingRound));
    setPaidRounds(newPaidRounds);
    setCurrentBillingRound((prev) => prev + 1);
  };

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
    unpaidOrders,
    amountDue,
  };
}
