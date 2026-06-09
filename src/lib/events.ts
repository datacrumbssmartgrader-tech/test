/**
 * Simple in-memory event system for SSE
 * In production, use a message queue (Redis, Kafka, etc.)
 */

interface SSEListener {
  send: (data: string) => void;
  close: () => void;
}

interface SSEEvent {
  type: string;
  data: any;
  timestamp: Date;
}

class EventManager {
  private adminListeners: Set<SSEListener> = new Set();
  private dineListeners: Map<string, Set<SSEListener>> = new Map();
  private eventHistory: SSEEvent[] = [];
  private maxHistorySize = 100;

  /**
   * Register an admin listener
   */
  registerAdminListener(listener: SSEListener) {
    this.adminListeners.add(listener);
    return () => {
      this.adminListeners.delete(listener);
    };
  }

  /**
   * Register a dine listener for a session
   */
  registerDineListener(sessionId: string, listener: SSEListener) {
    if (!this.dineListeners.has(sessionId)) {
      this.dineListeners.set(sessionId, new Set());
    }
    this.dineListeners.get(sessionId)!.add(listener);
    return () => {
      const listeners = this.dineListeners.get(sessionId);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.dineListeners.delete(sessionId);
        }
      }
    };
  }

  /**
   * Emit event to admin listeners
   */
  emitToAdmin(type: string, data: any) {
    const event: SSEEvent = {
      type,
      data,
      timestamp: new Date(),
    };
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    const sseEvent = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const listener of this.adminListeners) {
      try {
        listener.send(sseEvent);
      } catch (error) {
        this.adminListeners.delete(listener);
      }
    }
  }

  /**
   * Emit event to dine listeners for a session
   */
  emitToDine(sessionId: string, type: string, data: any) {
    const listeners = this.dineListeners.get(sessionId);
    if (!listeners) return;

    const sseEvent = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const listener of listeners) {
      try {
        listener.send(sseEvent);
      } catch (error) {
        listeners.delete(listener);
      }
    }
  }

  /**
   * Get event history (for debugging/recovery)
   */
  getHistory(type?: string) {
    if (type) {
      return this.eventHistory.filter((e) => e.type === type);
    }
    return this.eventHistory;
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.eventHistory = [];
  }
}

declare global {
  var __eventManager: EventManager | undefined;
}

export const eventManager = global.__eventManager || new EventManager();

if (process.env.NODE_ENV !== 'production') {
  global.__eventManager = eventManager;
}
