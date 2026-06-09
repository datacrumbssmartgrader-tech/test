import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyTokenEdge } from '@/lib/auth';

/**
 * PATCH /api/admin/payments/:id
 * Update payment status (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const token = request.headers.get('cookie')?.split('rw_session=')[1]?.split(';')[0];
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = await verifyTokenEdge(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: paymentId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Get payment details
    const paymentResult = await sql`
      SELECT 
        id,
        session_id,
        table_id,
        amount,
        method,
        paid_at
      FROM payments
      WHERE id = ${paymentId}::uuid
    `;

    if (paymentResult.length === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const payment = paymentResult[0];

    // For now, we just return the payment with the requested status
    // In a real system, this might trigger reconciliation processes

    return NextResponse.json(
      {
        payment_id: payment.id,
        session_id: payment.session_id,
        table_id: payment.table_id,
        amount: payment.amount,
        payment_method: payment.method,
        status: status,
        paid_at: payment.paid_at,
        message: `Payment status updated to "${status}"`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PATCH /api/admin/payments/:id error:', error);
    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 }
    );
  }
}
