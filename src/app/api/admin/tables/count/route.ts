import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyTokenEdge } from '@/lib/auth';
import { eventManager } from '@/lib/events';

const MIN_COUNT = 1;

/**
 * PATCH /api/admin/tables/count
 * Set the number of visible tables. No upper limit — new tables are created
 * on demand when the pre-seeded reserve pool is exhausted.
 * Decreasing hides the last N visible tables (blocked if any are active).
 */
export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('cookie')?.split('rw_session=')[1]?.split(';')[0];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyTokenEdge(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const count = Number(body.count);

    if (!Number.isInteger(count) || count < MIN_COUNT) {
      return NextResponse.json(
        { error: `Count must be a positive integer` },
        { status: 400 }
      );
    }

    const all = await sql`
      SELECT id, status, is_visible FROM restaurant_tables ORDER BY id ASC
    `;

    const visible = all.filter((t: any) => t.is_visible);
    const hidden  = all.filter((t: any) => !t.is_visible);
    const current = visible.length;

    if (count > current) {
      const needed = count - current;

      // First, reveal existing hidden tables
      const toShow = hidden.slice(0, needed);
      for (const t of toShow) {
        await sql`
          UPDATE restaurant_tables
          SET is_visible = true, status = 'disabled'
          WHERE id = ${t.id}
        `;
      }

      // If hidden pool exhausted, create new tables on the fly
      const toCreate = needed - toShow.length;
      if (toCreate > 0) {
        const allNums = all.map((t: any) => parseInt(t.id.substring(1), 10)).filter(Number.isFinite);
        let nextNum = allNums.length > 0 ? Math.max(...allNums) + 1 : 1;
        for (let i = 0; i < toCreate; i++) {
          const tableId = `T${String(nextNum).padStart(2, '0')}`;
          const label = `Table ${nextNum}`;
          await sql`
            INSERT INTO restaurant_tables (id, label, status, is_visible)
            VALUES (${tableId}, ${label}, 'disabled', true)
            ON CONFLICT (id) DO NOTHING
          `;
          nextNum++;
        }
      }
    } else if (count < current) {
      const toHide = visible.slice(count);
      const blocked = toHide.filter((t: any) => t.status === 'active');
      if (blocked.length > 0) {
        const ids = blocked.map((t: any) => t.id).join(', ');
        return NextResponse.json(
          { error: `Cannot hide tables with active sessions: ${ids}` },
          { status: 400 }
        );
      }
      for (const t of toHide) {
        await sql`
          UPDATE restaurant_tables
          SET is_visible = false, status = 'disabled'
          WHERE id = ${t.id}
        `;
      }
    }

    eventManager.emitToAdmin('table:update', { count });
    return NextResponse.json({ count }, { status: 200 });
  } catch (error) {
    console.error('PATCH /api/admin/tables/count error:', error);
    return NextResponse.json({ error: 'Failed to update table count' }, { status: 500 });
  }
}
