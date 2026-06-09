import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyTokenEdge } from '@/lib/auth';

/**
 * GET /api/admin/orders
 * Fetch all recent orders for the admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('cookie')?.split('rw_session=')[1]?.split(';')[0];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyTokenEdge(token);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch orders with item aggregation
    const ordersResult = await sql`
      SELECT 
        o.id, 
        rt.label as table_number, 
        o.status, 
        o.total, 
        o.placed_at as created_at,
        COALESCE(
          json_agg(
            json_build_object('name', oi.name, 'quantity', oi.qty, 'price', oi.price, 'notes', oi.note)
          ) FILTER (WHERE oi.id IS NOT NULL), 
          '[]'
        ) as items
      FROM orders o
      JOIN restaurant_tables rt ON o.table_id = rt.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id, rt.label
      ORDER BY o.placed_at DESC
      LIMIT 100
    `;

    const mapped = (ordersResult as any[]).map((o) => ({
      ...o,
      total: Number(o.total),
      items: Array.isArray(o.items)
        ? o.items.map((it: any) => ({ ...it, price: Number(it.price || 0), quantity: Number(it.quantity || it.qty || 1) }))
        : [],
    }));

    return NextResponse.json(mapped, { status: 200 });
  } catch (error) {
    console.error('GET /api/admin/orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
