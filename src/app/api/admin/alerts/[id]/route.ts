import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyTokenEdge } from '@/lib/auth';

/**
 * PATCH /api/admin/alerts/:id
 * Mark alert as resolved (admin only)
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

    const { id: alertId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!alertId) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
    }

    // Update alert
    const dismissed = status === 'resolved' ? true : false;

    const alertResult = await sql`
      UPDATE waiter_alerts 
      SET dismissed = ${dismissed}
      WHERE id = ${alertId}::uuid
      RETURNING id, table_id, session_id, type, message, dismissed, created_at
    `;

    if (alertResult.length === 0) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    const alert = alertResult[0];

    return NextResponse.json(
      {
        alert_id: alert.id,
        table_id: alert.table_id,
        session_id: alert.session_id,
        type: alert.type,
        status: alert.dismissed ? 'resolved' : 'pending',
        message: alert.message,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PATCH /api/admin/alerts/:id error:', error);
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/alerts/:id
 * Delete an alert (admin only)
 */
export async function DELETE(
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

    const { id: alertId } = await params;

    if (!alertId) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
    }

    // Delete alert
    await sql`DELETE FROM waiter_alerts WHERE id = ${alertId}::uuid`;

    return NextResponse.json(
      { message: 'Alert deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/admin/alerts/:id error:', error);
    return NextResponse.json(
      { error: 'Failed to delete alert' },
      { status: 500 }
    );
  }
}
