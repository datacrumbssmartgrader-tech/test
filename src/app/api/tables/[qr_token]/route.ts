import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

/**
 * GET /api/tables/:qr_token
 * Get table information by QR token (public endpoint, no auth required)
 * Used when customers scan QR code
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ qr_token: string }> }
) {
  try {
    const { qr_token } = await params;

    // Validate QR token format (should be a UUID)
    if (!qr_token || qr_token.length < 10) {
      return NextResponse.json(
        { error: 'Invalid QR token format' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(qr_token)) {
      return NextResponse.json(
        { error: 'Invalid or expired QR token' },
        { status: 404 }
      );
    }

    // Get table by QR token
    const tables = await sql`
      SELECT 
        id,
        label,
        status,
        qr_token,
        active_session_id
      FROM restaurant_tables
      WHERE qr_token = ${qr_token}::uuid
    `;

    if (tables.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired QR token' },
        { status: 404 }
      );
    }

    const table = tables[0];

    // Note: We return the table info even if disabled
    // The dine app will check status and prevent session creation
    return NextResponse.json({
      id: table.id,
      number: parseInt(table.id.substring(1)),
      label: table.label,
      status: table.status,
      active_session_id: table.active_session_id,
      qr_token: table.qr_token.toString(),
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching table by QR token:', error);
    return NextResponse.json(
      { error: 'Failed to fetch table information' },
      { status: 500 }
    );
  }
}
