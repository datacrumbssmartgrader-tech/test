"use client";

import { useState, useCallback } from "react";
import type { CartItem } from "@/components/dine/CartScreen";
import type { OrderBatch } from "@/components/dine/OrderTracker";
import * as api from "@/lib/api";
import type { SessionOrder } from "@/lib/api";

export const API_STATUS_MAP: Record<string, OrderBatch["status"]> = {
  placed: "received",
  kitchen: "kitchen",
  ready: "on-its-way",
  served: "served",
  cancelled: "served",
};

export function useOrders() {
  const [orders, setOrders] = useState<OrderBatch[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextOrderId, setNextOrderId] = useState(1);

  const placeOrder = useCallback(
    async (
      sessionId: string,
      cart: CartItem[],
      billingRound: number
    ): Promise<{ success: boolean; error?: string }> => {
      setIsSubmitting(true);
      try {
        const orderItems = cart.map((item) => ({
          menu_id: item.menuId,
          quantity: item.qty,
          notes: item.note || undefined,
        }));

        const response = await api.submitOrder(sessionId, orderItems);

        if (response.status === 200 || response.status === 201) {
          const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
          const batch: OrderBatch = {
            id: response.data?.order_id || response.data?.id || String(nextOrderId),
            items: [...cart],
            total: subtotal,
            status: "received",
            placedAt: Date.now(),
            billingRound,
          };
          setOrders((prev) => [...prev, batch]);
          setNextOrderId((prev) => prev + 1);
          return { success: true };
        } else {
          return { success: false, error: response.error || "Failed to place order" };
        }
      } catch {
        return { success: false, error: "Error placing order. Please try again." };
      } finally {
        setIsSubmitting(false);
      }
    },
    [nextOrderId]
  );

  const applySSEStatusChange = useCallback((orderId: string, rawStatus: string) => {
    const newStatus = API_STATUS_MAP[rawStatus] ?? (rawStatus as OrderBatch["status"]);
    setOrders((prev) =>
      prev.map((batch) => (batch.id === orderId ? { ...batch, status: newStatus } : batch))
    );
  }, []);

  const restoreOrders = useCallback((fetched: SessionOrder[]) => {
    const batches: OrderBatch[] = fetched.map((o) => ({
      id: o.order_id,
      items: o.items.map((i) => ({
        id: i.menuId,
        menuId: i.menuId,
        name: i.name,
        price: Number(i.price),
        qty: i.qty,
        note: i.note ?? '',
        img: '',
        cat: '',
        prepTime: 0,
      })),
      total: o.total,
      status: API_STATUS_MAP[o.status] ?? (o.status as OrderBatch["status"]),
      placedAt: new Date(o.placed_at).getTime(),
      billingRound: o.billing_round,
    }));
    setOrders(batches);
    setNextOrderId(batches.length + 1);
  }, []);

  return { orders, isSubmitting, placeOrder, applySSEStatusChange, restoreOrders };
}
