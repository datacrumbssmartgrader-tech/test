/**
 * useSSE Hook - Server-Sent Events stream management
 * Handles real-time updates from admin and dine streams
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';

export interface SSEEvent {
  type: string;
  data: any;
}

interface UseSSEOptions {
  onEvent?: (event: SSEEvent) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
  autoReconnect?: boolean;
  reconnectDelay?: number;
}

export function useSSE(endpoint: string, options: UseSSEOptions = {}) {
  const {
    onEvent,
    onError,
    onClose,
    autoReconnect = true,
    reconnectDelay = 3000,
  } = options;

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCleaningUpRef = useRef(false);

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;

    // 💎 FIX: Stop the execution immediately if the endpoint path is empty!
    if (!endpoint || endpoint.trim() === '') {
      console.log('🔌 SSE connection aborted: No valid endpoint provided yet.');
      return;
    }
    
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${window.location.origin}${endpoint}`;
      const eventSource = new EventSource(url);

      eventSource.onmessage = (e) => {
        try {
          const event: SSEEvent = {
            type: e.lastEventId || 'message',
            data: JSON.parse(e.data),
          };
          onEvent?.(event);
        } catch (err) {
          onError?.(new Error(`Failed to parse SSE event: ${err}`));
        }
      };

      eventSource.addEventListener('order:created', (e) => {
        try {
          onEvent?.({
            type: 'order:created',
            data: JSON.parse((e as any).data),
          });
        } catch (err) {
          onError?.(new Error(`Failed to parse event: ${err}`));
        }
      });

      eventSource.addEventListener('order:status_changed', (e) => {
        try {
          onEvent?.({
            type: 'order:status_changed',
            data: JSON.parse((e as any).data),
          });
        } catch (err) {
          onError?.(new Error(`Failed to parse event: ${err}`));
        }
      });

      eventSource.addEventListener('menu:item_added', (e) => {
        try {
          onEvent?.({
            type: 'menu:item_added',
            data: JSON.parse((e as any).data),
          });
        } catch (err) {
          onError?.(new Error(`Failed to parse event: ${err}`));
        }
      });

      eventSource.addEventListener('menu:item_updated', (e) => {
        try {
          onEvent?.({
            type: 'menu:item_updated',
            data: JSON.parse((e as any).data),
          });
        } catch (err) {
          onError?.(new Error(`Failed to parse event: ${err}`));
        }
      });

      eventSource.addEventListener('menu:item_deleted', (e) => {
        try {
          onEvent?.({
            type: 'menu:item_deleted',
            data: JSON.parse((e as any).data),
          });
        } catch (err) {
          onError?.(new Error(`Failed to parse event: ${err}`));
        }
      });

      eventSource.addEventListener('alert:created', (e) => {
        try {
          onEvent?.({
            type: 'alert:created',
            data: JSON.parse((e as any).data),
          });
        } catch (err) {
          onError?.(new Error(`Failed to parse event: ${err}`));
        }
      });

      eventSource.addEventListener('payment:received', (e) => {
        try {
          onEvent?.({
            type: 'payment:received',
            data: JSON.parse((e as any).data),
          });
        } catch (err) {
          onError?.(new Error(`Failed to parse event: ${err}`));
        }
      });

      eventSource.onerror = () => {
        if (!isCleaningUpRef.current) {
          eventSource.close();
          eventSourceRef.current = null;
          onError?.(new Error('SSE connection error'));

          if (autoReconnect) {
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, reconnectDelay);
          } else {
            onClose?.();
          }
        }
      };

      eventSourceRef.current = eventSource;
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error('Failed to connect to SSE'));
    }
  }, [endpoint, onEvent, onError, onClose, autoReconnect, reconnectDelay]);

  const disconnect = useCallback(() => {
    isCleaningUpRef.current = true;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    isCleaningUpRef.current = false;
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { disconnect, reconnect: connect };
}

/**
 * Hook for admin stream (requires auth)
 */
export function useAdminStream(options: UseSSEOptions = {}) {
  return useSSE('/api/admin/stream', { autoReconnect: true, ...options });
}

/**
 * Hook for dine stream (session-specific)
 */
export function useDineStream(sessionId: string | null, options: UseSSEOptions = {}) {
  const endpoint = sessionId ? `/api/dine/stream/${sessionId}` : '';
  const { disconnect } = useSSE(endpoint, {
    autoReconnect: true,
    ...options,
  });

  // Disconnect if sessionId becomes null
  useEffect(() => {
    if (!sessionId) {
      disconnect();
    }
  }, [sessionId, disconnect]);

  return { disconnect };
}
