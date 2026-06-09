import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyTokenEdge } from '@/lib/auth';
import * as XLSX from 'xlsx';

/**
 * GET /api/admin/payments/export/excel
 * Export all payments to Excel file (admin only)
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

    // Get all payments with session and customer info
    const payments = await sql`
      SELECT 
        p.id,
        p.session_id,
        p.table_id,
        p.billing_round,
        p.amount,
        p.method,
        p.paid_at,
        s.customer_id,
        c.name AS customer_name,
        c.phone AS customer_phone
      FROM payments p
      JOIN sessions s ON p.session_id = s.id
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY p.paid_at DESC
    `;

    // Transform data for Excel export
    const excelData = payments.map((payment: any) => ({
      'Payment ID': payment.id,
      'Customer': payment.customer_name || 'Unknown',
      'Phone': payment.customer_phone || '',
      'Table': payment.table_id,
      'Method': payment.method,
      'Amount': parseFloat(payment.amount) || 0,
      'Billing Round': payment.billing_round,
      'Paid At': new Date(payment.paid_at).toLocaleString(),
    }));

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payments');

    // Set column widths
    ws['!cols'] = [
      { wch: 36 },
      { wch: 20 },
      { wch: 15 },
      { wch: 8 },
      { wch: 12 },
      { wch: 10 },
      { wch: 12 },
      { wch: 20 },
    ];

    // Write to buffer
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    // Return as file download
    const response = new NextResponse(buffer);
    response.headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    response.headers.set('Content-Disposition', 'attachment; filename="payments.xlsx"');
    response.headers.set('Cache-Control', 'no-store');

    return response;
  } catch (error) {
    console.error('GET /api/admin/payments/export/excel error:', error);
    return NextResponse.json(
      { error: 'Failed to export payments' },
      { status: 500 }
    );
  }
}
