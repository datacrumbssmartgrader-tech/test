import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

/**
 * GET /api/sessions/:session_id/orders
 * Returns session closed_at + all orders with items.
 * closed_at non-null means the session was reset by admin.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ session_id: string }> }
) {
  try {
    const { session_id: sessionId } = await params;

    const sessionRows = await sql`
      SELECT closed_at FROM sessions WHERE id = ${sessionId}::uuid
    `;

    if (sessionRows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const orders = await sql`
      SELECT
        o.id          AS order_id,
        o.status,
        o.total,
        o.billing_round,
        o.placed_at,
        json_agg(
          json_build_object(
            'menuId',  oi.menu_item_id,
            'name',    oi.name,
            'price',   oi.price,
            'qty',     oi.qty,
            'note',    oi.note
          ) ORDER BY oi.created_at ASC
        ) FILTER (WHERE oi.id IS NOT NULL) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.session_id = ${sessionId}::uuid
        AND o.status != 'cancelled'
      GROUP BY o.id
      ORDER BY o.placed_at ASC
    `;

    return NextResponse.json({
      closed_at: sessionRows[0].closed_at ?? null,
      orders: orders.map((o: any) => ({
        ...o,
        total: Number(o.total),
        items: o.items ?? [],
      })),
    });
  } catch (error) {
    console.error('GET /api/sessions/:session_id/orders error:', error);
    return NextResponse.json({ error: 'Failed to retrieve orders' }, { status: 500 });
  }
}