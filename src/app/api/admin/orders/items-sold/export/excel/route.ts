import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyTokenEdge } from '@/lib/auth';
import * as XLSX from 'xlsx';

/**
 * GET /api/admin/orders/items-sold/export/excel?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Export items sold summary to Excel (admin only).
 * Optional date range filters via ?from= and ?to= query params.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('cookie')?.split('rw_session=')[1]?.split(';')[0];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyTokenEdge(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to   = searchParams.get('to');

    const rows = await sql`
      SELECT
        mi.name,
        SUM(oi.qty)                          AS qty_sold,
        SUM(oi.qty * oi.price)               AS revenue
      FROM order_items oi
      JOIN orders      o  ON oi.order_id  = o.id
      JOIN menu_items  mi ON oi.menu_item_id = mi.id
      WHERE o.status != 'cancelled'
        AND (${from}::date IS NULL OR o.placed_at::date >= ${from}::date)
        AND (${to}::date   IS NULL OR o.placed_at::date <= ${to}::date)
      GROUP BY mi.name
      ORDER BY qty_sold DESC
    `;

    const excelData = rows.map((r: any, i: number) => ({
      '#': i + 1,
      'Item': r.name,
      'Qty Sold': Number(r.qty_sold),
      'Revenue (PKR)': Number(r.revenue),
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    ws['!cols'] = [{ wch: 5 }, { wch: 32 }, { wch: 12 }, { wch: 16 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Items Sold');

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const response = new NextResponse(buffer);
    response.headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    response.headers.set('Content-Disposition', 'attachment; filename="items-sold.xlsx"');
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('GET /api/admin/orders/items-sold/export/excel error:', error);
    return NextResponse.json({ error: 'Failed to export items sold' }, { status: 500 });
  }
}
