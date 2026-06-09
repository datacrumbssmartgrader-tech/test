import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { eventManager } from '@/lib/events';

/**
 * POST /api/orders
 * Create a new order for a session
 * - Validates session exists
 * - Adds items to order
 * - Calculates total price
 * - Returns order_id with details
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, items } = body;

    // Validate required fields
    if (!session_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: session_id, items array' },
        { status: 400 }
      );
    }

    // Validate each item has required fields
    for (const item of items) {
      if (!item.menu_item_id || !item.quantity) {
        return NextResponse.json(
          { error: 'Each item must have menu_item_id and quantity' },
          { status: 400 }
        );
      }
    }

    // Get session details
    const sessionResult = await sql`
      SELECT id, table_id, customer_id, billing_round, closed_at
      FROM sessions 
      WHERE id = ${session_id}::uuid
    `;

    if (sessionResult.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (sessionResult[0].closed_at) {
      return NextResponse.json(
        { error: 'Cannot order on closed session' },
        { status: 400 }
      );
    }

    const session = sessionResult[0];

    // Get menu item details and calculate total
    let total = 0;
    const menuItems = [];

    for (const item of items) {
      const menuResult = await sql`
        SELECT id, name, price, available
        FROM menu_items 
        WHERE id = ${item.menu_item_id}::uuid
      `;

      if (menuResult.length === 0) {
        return NextResponse.json(
          { error: `Menu item ${item.menu_item_id} not found` },
          { status: 404 }
        );
      }

      const menuItem = menuResult[0];

      if (!menuItem.available) {
        return NextResponse.json(
          { error: `Menu item "${menuItem.name}" is not available` },
          { status: 400 }
        );
      }

      const itemTotal = menuItem.price * item.quantity;
      total += itemTotal;

      menuItems.push({
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        note: item.special_instructions || null,
      });
    }

    // Create order
    const orderResult = await sql`
      INSERT INTO orders (session_id, table_id, billing_round, status, total, placed_at, updated_at)
      VALUES (${session_id}::uuid, ${session.table_id}, ${session.billing_round}, 'received', ${total}::numeric, now(), now())
      RETURNING id, session_id, table_id, status, total, placed_at
    `;

    const order = orderResult[0];

    // Fetch table label for SSE event
    const tableResult = await sql`
      SELECT label FROM restaurant_tables WHERE id::text = ${String(session.table_id)}
    `;
    const tableLabel = tableResult[0]?.label || String(session.table_id);

    // Add order items
    for (const item of menuItems) {
      await sql`
        INSERT INTO order_items (order_id, menu_item_id, name, price, qty, note)
        VALUES (${order.id}::uuid, ${item.id}::uuid, ${item.name}, ${item.price}::numeric, ${item.quantity}, ${item.note})
      `;
    }
    // Emit event to admin stream
    eventManager.emitToAdmin('order:created', {
      order_id:     order.id,
      session_id:   order.session_id,
      table_id:     order.table_id,
      table_number: tableLabel,
      status:       order.status,
      total:        Number(order.total),
      items:        menuItems.map(i => ({ ...i, price: Number(i.price) })),
      placed_at:    order.placed_at,
    });

    // Emit event to dine stream for this session
    eventManager.emitToDine(order.session_id, 'order:created', {
      order_id: order.id,
      status: order.status,
      total: order.total,
      items: menuItems,
      placed_at: order.placed_at,
    });
    return NextResponse.json(
      {
        order_id: order.id,
        session_id: order.session_id,
        table_id: order.table_id,
        status: order.status,
        total: order.total,
        items: menuItems,
        placed_at: order.placed_at,
        message: 'Order created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/orders error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
