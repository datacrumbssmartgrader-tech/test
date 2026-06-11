import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

/**
 * GET /api/sessions/:session_id/payments
 * List all payment records for a session (public endpoint)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ session_id: string }> }
) {
  try {
    const { session_id: sessionId } = await params;

    const rows = await sql`
      SELECT
        id          AS payment_id,
        billing_round,
        order_ids,
        amount,
        method,
        paid_at
      FROM payments
      WHERE session_id = ${sessionId}::uuid
      ORDER BY paid_at ASC
    `;

    return NextResponse.json(
      rows.map((r: any) => ({ ...r, amount: Number(r.amount) })),
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/sessions/:session_id/payments error:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}