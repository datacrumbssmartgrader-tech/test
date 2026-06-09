import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenEdge } from '@/lib/auth';
import { eventManager } from '@/lib/events';

/**
 * GET /api/admin/stream
 * Server-Sent Events stream for admin dashboard
 * Emits events for: orders, menu items, alerts, payments, table status
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

    // Create SSE response
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        controller.enqueue('data: {"type":"connected","message":"Admin stream connected"}\n\n');

        // Register listener
        const unsubscribe = eventManager.registerAdminListener({
          send: (data: string) => {
            try {
              controller.enqueue(data);
            } catch (error) {
              console.error('SSE send error:', error);
              unsubscribe();
            }
          },
          close: () => {
            try {
              controller.close();
            } catch (e) {}
          },
        });

        // Store unsubscribe function on the controller context for fallback access
        (controller as any)._unsubscribe = unsubscribe;

        // Handle explicit client disconnect signal
        request.signal.addEventListener('abort', () => {
          unsubscribe();
          try { controller.close(); } catch (e) {}
        });
      },
      // 💎 CRITICAL FIX: The ultimate fallback catch for severed client pipelines
      cancel(reason) {
        console.log('🔌 Stream read pipeline canceled by client:', reason);
        if ((this as any)._unsubscribe) {
          (this as any)._unsubscribe();
        }
      }
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('GET /api/admin/stream error:', error);
    return NextResponse.json(
      { error: 'Failed to establish stream' },
      { status: 500 }
    );
  }
}
