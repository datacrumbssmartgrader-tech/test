import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyTokenEdge } from '@/lib/auth';
import QRCode from 'qrcode';

/**
 * GET /api/admin/tables/:id/qr
 * Generate and return QR code PNG image for a table
 * Requires authentication
 */
export async function GET(
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

    // Get table with QR token
    const tables = await sql`
      SELECT id, label, qr_token
      FROM restaurant_tables
      WHERE id = ${tableId}
    `;

    if (tables.length === 0) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    const table = tables[0];
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const qrUrl = `${baseUrl}/api/scan/${table.qr_token}`;
    // Generate QR code as PNG buffer
    const qrCodeBuffer = await QRCode.toBuffer(qrUrl, {
      type: 'png',
      width: 300,
      margin: 1,
      errorCorrectionLevel: 'H',
    });

// Return PNG image
    return new NextResponse(new Uint8Array(qrCodeBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
        'Content-Disposition': `inline; filename="qr-${tableId}.png"`,
      },
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}
