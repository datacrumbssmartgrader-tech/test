import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyTokenEdge } from '@/lib/auth';

/**
 * GET /api/admin/customers/:id
 * Get detailed customer information with visit history (admin only)
 */
export async function GET(
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

    const { id: customerId } = await params;

    // Get customer details
    const customerResult = await sql`
      SELECT 
        id,
        name,
        email,
        phone,
        total_sessions,
        total_spent,
        first_visit,
        last_visit,
        created_at
      FROM customers
      WHERE id = ${customerId}::uuid
    `;

    if (customerResult.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const customer = customerResult[0];

    // Get session history for this customer
    const sessions = await sql`
      SELECT 
        id,
        table_id,
        opened_at,
        closed_at,
        total_paid,
        billing_round
      FROM sessions
      WHERE customer_id = ${customerId}::uuid
      ORDER BY opened_at DESC
    `;

    return NextResponse.json(
      {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        visit_count: customer.total_sessions,
        total_sessions: customer.total_sessions,
        total_spent: customer.total_spent,
        first_visit: customer.first_visit,
        last_visit: customer.last_visit,
        created_at: customer.created_at,
        sessions: sessions.map((s: any) => ({
          id: s.id,
          table_id: s.table_id,
          opened_at: s.opened_at,
          closed_at: s.closed_at,
          total_paid: s.total_paid,
          billing_round: s.billing_round,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/admin/customers/:id error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve customer' },
      { status: 500 }
    );
  }
}
