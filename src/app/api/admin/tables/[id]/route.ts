import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyTokenEdge } from '@/lib/auth';

/**
 * PATCH /api/admin/tables/:id
 * Update table status
 * Requires authentication
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

    const { id: tableId } = await params;
    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = ['empty', 'active', 'disabled'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: empty, active, disabled' },
        { status: 400 }
      );
    }

    // Update table status
    const result = await sql`
      UPDATE restaurant_tables
      SET status = ${status}::table_status
      WHERE id = ${tableId}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    const table = result[0];
    return NextResponse.json({
      id: table.id,
      number: parseInt(table.id.substring(1)),
      label: table.label,
      status: table.status,
      qr_token: table.qr_token.toString(),
      active_session_id: table.active_session_id,
      alert_active: table.alert_active,
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating table:', error);
    return NextResponse.json(
      { error: 'Failed to update table' },
      { status: 500 }
    );
  }
}
