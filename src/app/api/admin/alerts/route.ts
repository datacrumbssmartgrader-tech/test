import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyTokenEdge } from '@/lib/auth';
import { eventManager } from '@/lib/events';

/**
 * POST /api/admin/alerts
 * Create a waiter alert (called by dine app — no admin auth needed)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Support both field naming conventions:
    // - dine app sends:  { table_id, session_id, type, message }
    let table_id     = body.table_id   || null;
    const session_id = body.session_id || null;
    const alert_type = (body.alert_type || body.type) as string | undefined;
    const message    = body.message    || null;

    if (!alert_type) {
      return NextResponse.json({ error: 'Missing required field: type' }, { status: 400 });
    }
    if (!session_id) {
      return NextResponse.json({ error: 'Missing required field: session_id' }, { status: 400 });
    }

    // Derive table_id from session if not supplied directly
    if (!table_id) {
      const sessionRow = await sql`
        SELECT table_id FROM sessions WHERE id = ${session_id}::uuid LIMIT 1
      `;
      if (sessionRow.length === 0) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      table_id = sessionRow[0].table_id;
    }

    // Fetch table label for display (restaurant_tables.id is TEXT, no cast needed)
    const tableResult = await sql`
      SELECT label FROM restaurant_tables WHERE id = ${table_id}
    `;
    const tableLabel = tableResult[0]?.label || table_id;

    // Insert alert — table_id is TEXT, session_id is UUID (both NOT NULL)
    const alertResult = await sql`
      INSERT INTO waiter_alerts (table_id, session_id, type, message, dismissed)
      VALUES (
        ${table_id},
        ${session_id}::uuid,
        ${alert_type}::alert_type,
        ${message},
        false
      )
      RETURNING id, table_id, type, message, dismissed, created_at
    `;

    const alert = alertResult[0];

    // Emit SSE event to admin dashboard
    eventManager.emitToAdmin('alert:created', {
      id:          alert.id,
      table_id:    alert.table_id,
      table_label: tableLabel,
      type:        alert.type,
      status:      'pending',
      message:     alert.message,
      created_at:  alert.created_at,
    });

    return NextResponse.json(
      {
        id:          alert.id,
        alert_id:    alert.id,
        table_id:    alert.table_id,
        table_label: tableLabel,
        type:        alert.type,
        status:      'pending',
        message:     alert.message,
        created_at:  alert.created_at,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/admin/alerts error:', error);
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    );
  }
}


/**
 * GET /api/admin/alerts
 * List all active alerts (admin only)
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

    // Get active alerts joined with table label
    const alerts = await sql`
      SELECT 
        wa.id,
        wa.table_id,
        rt.label as table_label,
        wa.type,
        wa.message,
        wa.dismissed,
        wa.created_at
      FROM waiter_alerts wa
      LEFT JOIN restaurant_tables rt ON wa.table_id = rt.id
      WHERE wa.dismissed = false
      ORDER BY wa.created_at DESC
    `;

    return NextResponse.json(
      alerts.map((alert: any) => ({
        id:          alert.id,
        table_id:    alert.table_id,
        table_label: alert.table_label || alert.table_id,
        type:        alert.type,
        status:      alert.dismissed ? 'resolved' : 'pending',
        resolved:    alert.dismissed,
        message:     alert.message,
        created_at:  alert.created_at,
      })),
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/admin/alerts error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve alerts' },
      { status: 500 }
    );
  }
}
