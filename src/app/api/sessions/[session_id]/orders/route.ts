import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

/**
 * GET /api/sessions/:session_id/orders
 * Retrieve all orders for a specific session
 * Returns orders with their items
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ session_id: string }> }
) {
  try {
    const { session_id } = await params;

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get orders for session
    const ordersResult = await sql`
      SELECT 
        id, 
        session_id, 
        table_id, 
        billing_round, 
        status, 
        total, 
        placed_at, 
        updated_at
      FROM orders 
      WHERE session_id = ${session_id}::uuid
      ORDER BY placed_at DESC
    `;

    if (ordersResult.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Get items for each order
    const ordersWithItems = await Promise.all(
      ordersResult.map(async (order) => {
        const itemsResult = await sql`
          SELECT 
            id, 
            order_id, 
            menu_item_id, 
            name, 
            price, 
            qty, 
            note
          FROM order_items 
          WHERE order_id = ${order.id}::uuid
          ORDER BY created_at ASC
        `;

        return {
          id: order.id,
          session_id: order.session_id,
          table_id: order.table_id,
          billing_round: order.billing_round,
          status: order.status,
          total: order.total,
          placed_at: order.placed_at,
          updated_at: order.updated_at,
          items: itemsResult.map((item) => ({
            id: item.id,
            menu_item_id: item.menu_item_id,
            name: item.name,
            price: item.price,
            quantity: item.qty,
            note: item.note,
          })),
        };
      })
    );

    return NextResponse.json(ordersWithItems, { status: 200 });
  } catch (error) {
    console.error('GET /api/sessions/:session_id/orders error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve orders' },
      { status: 500 }
    );
  }
}
