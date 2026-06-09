import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyTokenEdge } from '@/lib/auth';
import * as XLSX from 'xlsx';

/**
 * GET /api/admin/customers/export/excel
 * Export all customers to Excel file (admin only)
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

    // Get all customers
    const customers = await sql`
      SELECT 
        id,
        name,
        email,
        phone,
        total_sessions,
        total_spent,
        first_visit,
        last_visit,
        created_at
      FROM customers
      ORDER BY last_visit DESC NULLS LAST
    `;

    // Transform data for Excel export
    const excelData = customers.map((customer: any) => ({
      'Name': customer.name,
      'Phone': customer.phone || '',
      'Email': customer.email || '',
      'Total Visits': customer.total_sessions,
      'Total Spent': parseFloat(customer.total_spent) || 0,
      'First Visit': new Date(customer.first_visit).toLocaleDateString(),
      'Last Visit': customer.last_visit ? new Date(customer.last_visit).toLocaleDateString() : 'Never',
      'Created At': new Date(customer.created_at).toLocaleDateString(),
    }));

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');

    // Set column widths
    ws['!cols'] = [
      { wch: 20 },
      { wch: 15 },
      { wch: 25 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
    ];

    // Write to buffer
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    // Return as file download
    const response = new NextResponse(buffer);
    response.headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    response.headers.set('Content-Disposition', 'attachment; filename="customers.xlsx"');
    response.headers.set('Cache-Control', 'no-store');

    return response;
  } catch (error) {
    console.error('GET /api/admin/customers/export/excel error:', error);
    return NextResponse.json(
      { error: 'Failed to export customers' },
      { status: 500 }
    );
  }
}
