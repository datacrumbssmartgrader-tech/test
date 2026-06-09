import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyTokenEdge } from '@/lib/auth';
import { eventManager } from '@/lib/events';

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.headers.get('cookie')?.split('rw_session=')[1]?.split(';')[0];
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

    const items = await sql`
      SELECT id, name, category, price, description, image_url, image_public_id, available, hidden, type, components, created_at
      FROM menu_items ORDER BY category, name
    `;

    return NextResponse.json({
      success: true,
      count: items.length,
      items: items,
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.headers.get('cookie')?.split('rw_session=')[1]?.split(';')[0];
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

    const body = await req.json();
    const { name, category, price, description, image_url, image_public_id, type, components } = body;

    // Validate required fields
    if (!name || !category || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, price' },
        { status: 400 }
      );
    }

    // Validate price is a number
    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return NextResponse.json(
        { error: 'Price must be a valid non-negative number' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO menu_items (name, category, price, description, image_url, image_public_id, type, components, available, hidden)
      VALUES (${name}, ${category}, ${priceNum}::numeric, ${description || null}, ${image_url || null}, ${image_public_id || null}, ${type || 'single'}, ${components || []}, true, false)
      RETURNING id, name, category, price, description, image_url, image_public_id, type, components, available, hidden, created_at
    `;

    const item = result[0];

    // Emit event to admin stream
    eventManager.emitToAdmin('menu:item_added', {
      item_id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      created_at: item.created_at,
    });

    return NextResponse.json(
      {
        success: true,
        item: item,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating menu item:', error);
    return NextResponse.json(
      { error: 'Failed to create menu item', details: String(error) },
      { status: 500 }
    );
  }
}
