import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyTokenEdge } from '@/lib/auth';
import { randomUUID } from 'crypto';

/**
 * POST /api/admin/tables/:id/regenerate-qr
 * Regenerate QR token for a table (invalidates old token)
 * Requires authentication
 */
export async function POST(
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

    // Generate new QR token
    const newQrToken = randomUUID();

    // Update table with new QR token and timestamp
    const result = await sql`
      UPDATE restaurant_tables
      SET qr_token = ${newQrToken}, qr_regenerated_at = now()
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
      qr_token: table.qr_token.toString(),
      qr_regenerated_at: table.qr_regenerated_at,
      message: 'QR token regenerated successfully',
    }, { status: 200 });
  } catch (error) {
    console.error('Error regenerating QR token:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate QR token' },
      { status: 500 }
    );
  }
}
