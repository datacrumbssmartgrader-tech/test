import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const items = await sql`
      SELECT id, name, category, price, description, image_url
      FROM menu_items 
      WHERE hidden = false AND available = true
      ORDER BY category, name
    `;

    return NextResponse.json({
      success: true,
      count: items.length,
      items: items,
    });
  } catch (error) {
    console.error('Error fetching public menu:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu', details: String(error) },
      { status: 500 }
    );
  }
}
