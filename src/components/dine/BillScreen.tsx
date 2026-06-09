"use client";

import { OrderBatch } from "./OrderTracker";

interface BillScreenProps {
  orders: OrderBatch[];
  paidRounds: Set<number>;
  onRequestBill: () => void;
  onPayNow: () => void;
  hasRequestedBill: boolean;
}

export default function BillScreen({ orders, paidRounds, onRequestBill, onPayNow, hasRequestedBill }: BillScreenProps) {
  if (orders.length === 0) {
    return (
      <div className="bill-scroll">
        <h2 className="section-title">My Bill</h2>
        <div className="bill-empty">
          <i className="ri-receipt-line"></i>
          <p>No orders yet — your bill will appear here.</p>
        </div>
      </div>
    );
  }

  // Group orders by billing round
  const roundMap = new Map<number, OrderBatch[]>();
  orders.forEach(b => {
    if (!roundMap.has(b.billingRound)) roundMap.set(b.billingRound, []);
    roundMap.get(b.billingRound)!.push(b);
  });

  const unpaidOrders = orders.filter(b => !paidRounds.has(b.billingRound));
  const unpaidTotal = unpaidOrders.reduce((sum, b) => sum + b.total, 0);

  return (
    <div className="bill-scroll">
      <h2 className="section-title">My Bill</h2>
      
      <div className="bill-content">
        <div id="billRounds">
          {Array.from(roundMap.entries()).map(([roundId, batches]) => {
            const isPaid = paidRounds.has(roundId);
            const roundTotal = batches.reduce((sum, b) => sum + b.total, 0);
            const allItems = batches.flatMap(b => b.items);

            return (
              <div key={roundId} className={`bill-round ${isPaid ? "bill-round-paid" : ""}`}>
                {isPaid && (
                  <div className="bill-round-status">
                    <i className="ri-checkbox-circle-fill"></i> Paid
                  </div>
                )}
                <div className="bill-items">
                  {allItems.map((it, idx) => (
                    <div key={idx} className="bill-item-row">
                      <span>{it.qty}&times; {it.name}</span>
                      <span className="bill-item-price">PKR {(it.price * it.qty).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="bill-divider"></div>
                <div className="bill-row bill-total">
                  <span>{isPaid ? "Total Paid" : "Total"}</span>
                  <span>PKR {roundTotal.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>

        {unpaidOrders.length > 0 && (
          <div className="bill-actions">
            <button className="btn-primary btn-full" onClick={onPayNow}>
              <i className="ri-bank-card-line"></i> Pay <span>PKR {unpaidTotal.toLocaleString()}</span>
            </button>
            <button 
              className="btn-ghost btn-full bill-ghost" 
              onClick={onRequestBill}
              disabled={hasRequestedBill}
            >
              {hasRequestedBill ? (
                <><i className="ri-check-line"></i> Request Sent</>
              ) : (
                <><i className="ri-receipt-line"></i> Request Bill</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
