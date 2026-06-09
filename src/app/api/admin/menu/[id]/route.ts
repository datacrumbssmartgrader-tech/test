import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { v2 as cloudinary } from 'cloudinary';
import { verifyTokenEdge } from '@/lib/auth';
import { eventManager } from '@/lib/events';

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: itemId } = await params;
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

    // Get current item to delete old image if needed
    const current = await sql`
      SELECT image_public_id FROM menu_items WHERE id = ${itemId}
    `;

    if (current.length === 0) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      );
    }

    // Delete old image if image_public_id changed and a new one was provided
    if (image_public_id && current[0].image_public_id && current[0].image_public_id !== image_public_id) {
      try {
        await cloudinary.api.delete_resources([current[0].image_public_id]);
      } catch (err) {
        console.error('Error deleting old image:', err);
      }
    }

    const result = await sql`
      UPDATE menu_items 
      SET name = ${name}, category = ${category}, price = ${priceNum}::numeric, description = ${description || null}, image_url = ${image_url || null}, image_public_id = ${image_public_id || null}, type = ${type || 'single'}, components = ${components || []}::text[]
      WHERE id = ${itemId}
      RETURNING id, name, category, price, description, image_url, image_public_id, type, components, available, hidden, created_at
    `;

    const item = result[0];

    // Emit event to admin stream
    eventManager.emitToAdmin('menu:item_updated', {
      item_id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
    });

    return NextResponse.json({
      success: true,
      item: item,
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    return NextResponse.json(
      { error: 'Failed to update menu item', details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: itemId } = await params;
    const body = await req.json();
    const { field, value } = body;

    // Only allow toggling specific fields
    if (!['available', 'hidden'].includes(field)) {
      return NextResponse.json(
        { error: 'Can only toggle available or hidden' },
        { status: 400 }
      );
    }

    // Build dynamic SQL query
    let result;
    if (field === 'available') {
      result = await sql`
        UPDATE menu_items 
        SET available = ${value}
        WHERE id = ${itemId}
        RETURNING id, name, category, price, description, image_url, image_public_id, available, hidden, created_at
      `;
    } else if (field === 'hidden') {
      result = await sql`
        UPDATE menu_items 
        SET hidden = ${value}
        WHERE id = ${itemId}
        RETURNING id, name, category, price, description, image_url, image_public_id, available, hidden, created_at
      `;
    }

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      item: result[0],
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    return NextResponse.json(
      { error: 'Failed to toggle menu item', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: itemId } = await params;

    // Get item to get image_public_id
    const item = await sql`
      SELECT image_public_id FROM menu_items WHERE id = ${itemId}
    `;

    if (item.length === 0) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      );
    }

    // Delete image from Cloudinary
    if (item[0].image_public_id) {
      try {
        await cloudinary.api.delete_resources([item[0].image_public_id]);
      } catch (err) {
        console.error('Error deleting image:', err);
      }
    }

    // Delete from database
    await sql`DELETE FROM menu_items WHERE id = ${itemId}`;

    return NextResponse.json({
      success: true,
      message: 'Menu item deleted',
    });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json(
      { error: 'Failed to delete menu item', details: String(error) },
      { status: 500 }
    );
  }
}
