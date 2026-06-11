import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyTokenEdge } from '@/lib/auth';
import { eventManager } from '@/lib/events';

/**
 * POST /api/admin/tables/:id/reset
 * Close the active session, clear table to empty.
 * Emits table:update and session:closed SSE events.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('cookie')?.split('rw_session=')[1]?.split(';')[0];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyTokenEdge(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: tableId } = await params;

    // Find and close the active session
    const closed = await sql`
      UPDATE sessions
      SET closed_at = now()
      WHERE table_id = ${tableId} AND closed_at IS NULL
      RETURNING id
    `;

    const closedSessionId = closed[0]?.id ?? null;

    // Clear the table
    await sql`
      UPDATE restaurant_tables
      SET status = 'empty', active_session_id = NULL
      WHERE id = ${tableId}
    `;

    // Notify admin stream
    eventManager.emitToAdmin('table:update', {
      table_id: tableId,
      status: 'empty',
      active_session_id: null,
    });

    // Notify dine client if session was active
    if (closedSessionId) {
      eventManager.emitToDine(closedSessionId, 'session:closed', {
        session_id: closedSessionId,
        table_id: tableId,
      });
    }

    return NextResponse.json({ success: true, table_id: tableId, closed_session_id: closedSessionId }, { status: 200 });
  } catch (error) {
    console.error('POST /api/admin/tables/:id/reset error:', error);
    return NextResponse.json({ error: 'Failed to reset table' }, { status: 500 });
  }
}
