import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyTokenEdge } from '@/lib/auth';
import * as XLSX from 'xlsx';

/**
 * GET /api/admin/orders/export/excel
 * Export all orders to Excel file (admin only)
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

    // Get all orders with session and customer info
    const orders = await sql`
      SELECT 
        o.id,
        o.session_id,
        o.table_id,
        o.status,
        o.total,
        o.placed_at,
        o.updated_at,
        s.customer_id,
        c.name AS customer_name,
        c.phone AS customer_phone
      FROM orders o
      JOIN sessions s ON o.session_id = s.id
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY o.placed_at DESC
    `;

    // Transform data for Excel export
    const excelData = orders.map((order: any) => ({
      'Order ID': order.id,
      'Customer': order.customer_name || 'Unknown',
      'Phone': order.customer_phone || '',
      'Table': order.table_id,
      'Status': order.status,
      'Total': parseFloat(order.total) || 0,
      'Placed At': new Date(order.placed_at).toLocaleString(),
      'Updated At': new Date(order.updated_at).toLocaleString(),
    }));

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');

    // Set column widths
    ws['!cols'] = [
      { wch: 36 },
      { wch: 20 },
      { wch: 15 },
      { wch: 8 },
      { wch: 12 },
      { wch: 10 },
      { wch: 20 },
      { wch: 20 },
    ];

    // Write to buffer
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    // Return as file download
    const response = new NextResponse(buffer);
    response.headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    response.headers.set('Content-Disposition', 'attachment; filename="orders.xlsx"');
    response.headers.set('Cache-Control', 'no-store');

    return response;
  } catch (error) {
    console.error('GET /api/admin/orders/export/excel error:', error);
    return NextResponse.json(
      { error: 'Failed to export orders' },
      { status: 500 }
    );
  }
}
