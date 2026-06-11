import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { eventManager } from '@/lib/events';

/**
 * POST /api/sessions/:session_id/payment
 * Record a payment for a session (customer/public endpoint - no auth required)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ session_id: string }> }
) {
  try {
    const { session_id: sessionId } = await params;
    const body = await request.json();
    const { amount, payment_method, notes } = body;

    if (!sessionId || !amount || !payment_method) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, payment_method' },
        { status: 400 }
      );
    }

    if (!['card', 'cash'].includes(payment_method)) {
      return NextResponse.json(
        { error: 'Invalid payment method. Must be card or cash' },
        { status: 400 }
      );
    }

    // Get session details and orders
    const sessionResult = await sql`
      SELECT id, table_id, billing_round FROM sessions WHERE id = ${sessionId}::uuid
    `;

    if (sessionResult.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = sessionResult[0];
    const billingRound = session.billing_round;

    // Get order IDs scoped to the current billing round
    const ordersResult = await sql`
      SELECT id FROM orders WHERE session_id = ${sessionId}::uuid AND billing_round = ${billingRound}
    `;

    const orderIds = ordersResult.map((order: any) => order.id);

    if (orderIds.length === 0) {
      return NextResponse.json(
        { error: 'No orders found for this session' },
        { status: 400 }
      );
    }

    // Create payment record
    const paymentResult = await sql`
      INSERT INTO payments (session_id, table_id, billing_round, order_ids, amount, method, paid_at)
      VALUES (${sessionId}::uuid, ${session.table_id}, ${session.billing_round}, ${orderIds}, ${amount}::numeric, ${payment_method}::payment_method, now())
      RETURNING id, session_id, table_id, amount, method, paid_at
    `;

    const payment = paymentResult[0];

    // Update session total_paid and increment billing_round
    await sql`
      UPDATE sessions
      SET total_paid = total_paid + ${amount}::numeric,
          billing_round = billing_round + 1
      WHERE id = ${sessionId}::uuid
    `;

    // Emit event to admin stream
    eventManager.emitToAdmin('payment:received', {
      payment_id: payment.id,
      session_id: payment.session_id,
      amount: Number(payment.amount),
      payment_method: payment.method,
      paid_at: payment.paid_at,
    });

    // Emit event to dine stream so the customer UI updates immediately
    eventManager.emitToDine(sessionId, 'payment:received', {
      billing_round: billingRound,
      order_ids: orderIds,
      amount: Number(payment.amount),
      method: payment.method,
      paid_at: payment.paid_at,
    });

    return NextResponse.json(
      {
        payment_id: payment.id,
        session_id: payment.session_id,
        amount: Number(payment.amount),
        payment_method: payment.method,
        status: 'confirmed',
        paid_at: payment.paid_at,
        notes,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/sessions/:session_id/payment error:', error);
    return NextResponse.json(
      { error: 'Failed to record payment' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sessions/:session_id/payment
 * Get payment information for a session (public endpoint)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ session_id: string }> }
) {
  try {
    const { session_id: sessionId } = await params;

    // Get latest payment for session
    const paymentResult = await sql`
      SELECT 
        id, 
        session_id, 
        amount, 
        method, 
        paid_at
      FROM payments
      WHERE session_id = ${sessionId}::uuid
      ORDER BY paid_at DESC
      LIMIT 1
    `;

    if (paymentResult.length === 0) {
      return NextResponse.json({ error: 'No payment found for this session' }, { status: 404 });
    }

    const payment = paymentResult[0];

    return NextResponse.json(
      {
        payment_id: payment.id,
        session_id: payment.session_id,
        amount: Number(payment.amount),
        payment_method: payment.method,
        status: 'confirmed',
        paid_at: payment.paid_at,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/sessions/:session_id/payment error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve payment' },
      { status: 500 }
    );
  }
}
