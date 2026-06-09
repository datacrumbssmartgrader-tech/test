import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyTokenEdge } from '@/lib/auth';

/**
 * GET /api/admin/customers
 * List all customers with visit and spending stats (admin only)
 * Query params: search=name (searches by name)
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

    // Get search query if provided
    const url = new URL(request.url);
    const searchQuery = url.searchParams.get('search');

    // Get all customers with stats (or filtered by search)
    const searchPattern = `%${searchQuery}%`;
    const customers = searchQuery
      ? await sql`
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
          WHERE name ILIKE ${searchPattern} OR phone ILIKE ${searchPattern} OR email ILIKE ${searchPattern}
          ORDER BY last_visit DESC NULLS LAST
        `
      : await sql`
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

    return NextResponse.json(
      customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        visit_count: customer.total_sessions,
        total_sessions: customer.total_sessions,
        total_spent: customer.total_spent,
        first_visit: customer.first_visit,
        last_visit: customer.last_visit,
        created_at: customer.created_at,
      })),
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/admin/customers error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve customers' },
      { status: 500 }
    );
  }
}
