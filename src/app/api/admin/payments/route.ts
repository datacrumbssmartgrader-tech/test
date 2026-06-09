import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyTokenEdge } from '@/lib/auth';

/**
 * GET /api/admin/payments
 * List all payments (admin only)
 */
export async function GET(request: NextRequest) {
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

    // Get all payments with session and customer info
    const payments = await sql`
      SELECT 
        p.id,
        p.session_id,
        p.table_id,
        p.amount,
        p.method,
        p.paid_at,
        s.customer_id,
        c.name AS customer_name
      FROM payments p
      JOIN sessions s ON p.session_id = s.id
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY p.paid_at DESC
    `;

    return NextResponse.json(
      payments.map((payment: any) => ({
        payment_id: payment.id,
        session_id: payment.session_id,
        table_id: payment.table_id,
        customer_name: payment.customer_name || 'Unknown',
        amount: payment.amount,
        payment_method: payment.method,
        status: 'confirmed',
        paid_at: payment.paid_at,
      })),
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/admin/payments error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve payments' },
      { status: 500 }
    );
  }
}
