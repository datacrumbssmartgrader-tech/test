import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyTokenEdge } from '@/lib/auth';

/**
 * GET /api/admin/tables
 * Returns all restaurant tables with QR token and session info
 * Requires authentication
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

    // Get all visible tables with session info
    const tables = await sql`
      SELECT
        rt.id,
        rt.label,
        rt.status,
        rt.qr_token,
        rt.active_session_id,
        rt.alert_active,
        rt.qr_regenerated_at,
        rt.is_visible,
        rt.created_at,
        COALESCE(s.total_paid, 0) as session_total_paid
      FROM restaurant_tables rt
      LEFT JOIN sessions s ON rt.active_session_id = s.id
      WHERE rt.is_visible = true
      ORDER BY rt.id ASC
    `;

    // Transform table IDs to numbers for response
    const formattedTables = tables.map((table: any) => ({
      id: table.id,
      number: parseInt(table.id.substring(1)), // Extract number from T01 -> 1
      label: table.label,
      status: table.status,
      qr_token: table.qr_token.toString(),
      active_session_id: table.active_session_id,
      alert_active: table.alert_active,
      qr_regenerated_at: table.qr_regenerated_at,
      is_visible: table.is_visible,
      created_at: table.created_at,
      session_total_paid: Number(table.session_total_paid || 0),
    }));

    return NextResponse.json(formattedTables, { status: 200 });
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tables' },
      { status: 500 }
    );
  }
}
