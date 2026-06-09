import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyTokenEdge } from '@/lib/auth';
import { eventManager } from '@/lib/events';

/**
 * PATCH /api/orders/:id
 * Update order status (admin only)
 * Valid statuses: received, kitchen, ready, served, cancelled
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

    const { id: orderId } = await params;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { status, cancel_reason } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Validate status is allowed
    const validStatuses = ['received', 'kitchen', 'ready', 'served', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Get current order
    const orderResult = await sql`
      SELECT id, session_id, status, total, placed_at
      FROM orders 
      WHERE id = ${orderId}::uuid
    `;

    if (orderResult.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update order status
    const updateQuery = cancel_reason && status === 'cancelled'
      ? sql`
          UPDATE orders 
          SET status = ${status}::order_status, cancel_reason = ${cancel_reason}, updated_at = now()
          WHERE id = ${orderId}::uuid
          RETURNING id, session_id, status, total, placed_at, updated_at, cancel_reason
        `
      : sql`
          UPDATE orders 
          SET status = ${status}::order_status, updated_at = now()
          WHERE id = ${orderId}::uuid
          RETURNING id, session_id, status, total, placed_at, updated_at
        `;

    const updatedOrder = await updateQuery;

    if (updatedOrder.length === 0) {
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    const order = updatedOrder[0];

    // Emit event to admin stream
    eventManager.emitToAdmin('order:status_changed', {
      order_id: order.id,
      session_id: order.session_id,
      status: order.status,
      total: order.total,
      updated_at: order.updated_at,
    });

    // Emit event to dine stream for this session
    eventManager.emitToDine(order.session_id, 'order:status_changed', {
      order_id: order.id,
      status: order.status,
      updated_at: order.updated_at,
    });

    return NextResponse.json(
      {
        order_id: order.id,
        session_id: order.session_id,
        status: order.status,
        total: order.total,
        placed_at: order.placed_at,
        updated_at: order.updated_at,
        cancel_reason: order.cancel_reason || null,
        message: `Order status updated to "${status}"`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PATCH /api/orders/:id error:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
