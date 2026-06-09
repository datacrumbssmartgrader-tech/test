import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { eventManager } from '@/lib/events';

/**
 * GET /api/dine/stream/:session_id
 * Server-Sent Events stream for dine page
 * Emits events for: order status changes, bill updates
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ session_id: string }> }
) {
  try {
    const { session_id: sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Verify session exists
    const sessionResult = await sql`
      SELECT id FROM sessions WHERE id = ${sessionId}::uuid
    `;

    if (sessionResult.length === 0) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Create SSE response
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        controller.enqueue('data: {"type":"connected","message":"Dine stream connected"}\n\n');

        // Register listener for this session
        const unsubscribe = eventManager.registerDineListener(sessionId, {
          send: (data: string) => {
            try {
              controller.enqueue(data);
            } catch (error) {
              console.error('SSE send error:', error);
            }
          },
          close: () => {
            controller.close();
          },
        });

        // Handle client disconnect
        request.signal.addEventListener('abort', () => {
          unsubscribe();
          controller.close();
        });
      },
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
    console.error('GET /api/dine/stream/:session_id error:', error);
    return NextResponse.json(
      { error: 'Failed to establish stream' },
      { status: 500 }
    );
  }
}
