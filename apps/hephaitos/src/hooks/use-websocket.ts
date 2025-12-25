/**
 * WebSocket Hook for Real-time Updates
 * Client-side hook for connecting to WebSocket streaming
 *
 * Usage:
 * const { progress, status, connect, disconnect } = useWebSocket(taskId);
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { WebSocketMessage, ProgressUpdate, TaskCompletionMessage } from '@/lib/mobile/websocket-manager';

export interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onProgress?: (update: ProgressUpdate) => void;
  onComplete?: (completion: TaskCompletionMessage) => void;
  onError?: (error: string) => void;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  progress: number;
  message: string;
  status: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
  error: string | null;
  latestUpdate: ProgressUpdate | null;
  completion: TaskCompletionMessage | null;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
}

export function useWebSocket(
  taskId: string,
  token: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const {
    autoConnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    heartbeatInterval = 30000,
    onMessage,
    onProgress,
    onComplete,
    onError,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [latestUpdate, setLatestUpdate] = useState<ProgressUpdate | null>(null);
  const [completion, setCompletion] = useState<TaskCompletionMessage | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setStatus('connecting');
    setError(null);

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const url = \`\${protocol}//\${host}/api/claude/commands/stream/\${taskId}?token=\${token}\`;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setStatus('connected');
        reconnectAttemptsRef.current = 0;

        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, heartbeatInterval);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          if (onMessage) {
            onMessage(message);
          }

          switch (message.type) {
            case 'progress':
              const progressData = message.data as ProgressUpdate;
              setProgress(progressData.progress);
              setMessage(progressData.message);
              setLatestUpdate(progressData);
              if (onProgress) {
                onProgress(progressData);
              }
              break;

            case 'complete':
              const completionData = message.data as TaskCompletionMessage;
              setCompletion(completionData);
              if (onComplete) {
                onComplete(completionData);
              }
              setTimeout(() => disconnect(), 2000);
              break;

            case 'error':
              const errorMessage = message.data?.error || 'Unknown error';
              setError(errorMessage);
              setStatus('error');
              if (onError) {
                onError(errorMessage);
              }
              break;

            case 'pong':
              break;

            default:
              console.log('[WebSocket] Unknown message type:', message.type);
          }
        } catch (err) {
          console.error('[WebSocket] Failed to parse message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('[WebSocket] Error:', event);
        setError('WebSocket connection error');
        setStatus('error');
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setStatus('disconnected');
        clearTimers();

        if (!event.wasClean && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError('Max reconnection attempts reached');
          setStatus('error');
        }
      };
    } catch (err) {
      console.error('[WebSocket] Connection failed:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
      setStatus('error');
    }
  }, [taskId, token, heartbeatInterval, reconnectInterval, maxReconnectAttempts, onMessage, onProgress, onComplete, onError, clearTimers]);

  const disconnect = useCallback(() => {
    clearTimers();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setStatus('disconnected');
  }, [clearTimers]);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect, disconnect]);

  useEffect(() => {
    if (autoConnect && taskId && token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, taskId, token]);

  return {
    isConnected,
    progress,
    message,
    status,
    error,
    latestUpdate,
    completion,
    connect,
    disconnect,
    reconnect,
  };
}

export function useTaskProgress(taskId: string, token: string) {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  const { status, error } = useWebSocket(taskId, token, {
    autoConnect: true,
    onProgress: (update) => {
      setProgress(update.progress);
      setMessage(update.message);
    },
    onComplete: () => {
      setProgress(100);
      setIsComplete(true);
    },
  });

  return {
    progress,
    message,
    isComplete,
    isLoading: status === 'connecting' || status === 'connected',
    error,
  };
}

export default useWebSocket;
