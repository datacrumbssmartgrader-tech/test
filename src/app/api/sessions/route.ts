import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { eventManager } from '@/lib/events';

/**
 * POST /api/sessions
 * Create a new session with customer matching
 * - Finds existing customer by phone or creates new
 * - Links customer to table via QR token
 * - Returns session_id and customer_id
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qr_token, customer_name, customer_phone, customer_email } = body;

    // Validate required fields
    if (!qr_token || !customer_name || !customer_phone) {
      return NextResponse.json(
        { error: 'Missing required fields: qr_token, customer_name, customer_phone' },
        { status: 400 }
      );
    }

    // Find table by QR token
    let tableResult;
    try {
      tableResult = await sql`
        SELECT id, label, status 
        FROM restaurant_tables 
        WHERE qr_token = ${qr_token}::uuid
      `;
    } catch (error: any) {
      // Invalid UUID format
      if (error.message && error.message.includes('invalid input syntax for type uuid')) {
        return NextResponse.json({ error: 'Invalid or expired QR token' }, { status: 404 });
      }
      throw error;
    }

    if (tableResult.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired QR token' }, { status: 404 });
    }

    const table = tableResult[0];
    const tableId = table.id;

    // Check if table is disabled
    if (table.status === 'disabled') {
      return NextResponse.json(
        { error: 'Table is disabled' },
        { status: 403 }
      );
    }

    // Return existing open session instead of creating a duplicate
    const existingSession = await sql`
      SELECT s.id, s.table_id, s.opened_at, s.customer_id,
             c.name AS customer_name_db
      FROM sessions s
      LEFT JOIN customers c ON c.id = s.customer_id
      WHERE s.table_id = ${tableId} AND s.closed_at IS NULL
      LIMIT 1
    `;
    if (existingSession.length > 0) {
      const s = existingSession[0];
      // Defensive: ensure table reflects active state (covers partial reset / race conditions)
      await sql`
        UPDATE restaurant_tables
        SET status = 'active', active_session_id = ${s.id}
        WHERE id = ${tableId} AND (status != 'active' OR active_session_id IS NULL)
      `;
      eventManager.emitToAdmin('table:update', {
        table_id: tableId,
        status: 'active',
        active_session_id: s.id,
      });
      return NextResponse.json({
        session_id: s.id,
        customer_id: s.customer_id,
        table_id: s.table_id,
        customer_name: s.customer_name_db || customer_name,
        opened_at: s.opened_at,
        message: 'Session resumed',
      }, { status: 200 });
    }

    // Find or create customer by phone
    const existingCustomer = await sql`
      SELECT id, name, email, total_sessions, total_spent, last_visit
      FROM customers 
      WHERE phone = ${customer_phone}
    `;

    let customerId;

    if (existingCustomer.length > 0) {
      // Customer exists - update last_visit
      customerId = existingCustomer[0].id;
      await sql`
        UPDATE customers 
        SET last_visit = now(), total_sessions = total_sessions + 1
        WHERE id = ${customerId}
      `;
    } else {
      // Create new customer
      const newCustomerResult = await sql`
        INSERT INTO customers (name, phone, email, total_sessions, first_visit, last_visit)
        VALUES (${customer_name}, ${customer_phone}, ${customer_email || null}, 1, now(), now())
        RETURNING id, name, phone, email, total_sessions, total_spent
      `;
      customerId = newCustomerResult[0].id;
    }

    // Create session linking customer to table
    const sessionResult = await sql`
      INSERT INTO sessions (table_id, customer_id, opened_at)
      VALUES (${tableId}, ${customerId}, now())
      RETURNING id, table_id, customer_id, opened_at
    `;

    const session = sessionResult[0];

    // Update table to active with session
    await sql`
      UPDATE restaurant_tables
      SET status = 'active', active_session_id = ${session.id}
      WHERE id = ${tableId}
    `;

    eventManager.emitToAdmin('table:update', {
      table_id: tableId,
      status: 'active',
      active_session_id: session.id,
    });

    return NextResponse.json(
      {
        session_id: session.id,
        customer_id: customerId,
        table_id: tableId,
        customer_name,
        opened_at: session.opened_at,
        message: 'Session created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
