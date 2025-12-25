/**
 * WebSocket Manager for Real-time Task Streaming
 * Provides real-time progress updates for command execution
 *
 * Features:
 * - Task progress streaming
 * - Connection management
 * - Auto-reconnect logic
 * - Heartbeat/ping-pong
 */

// Note: This is a server-side manager for WebSocket connections
// In Next.js, WebSocket support requires custom server or external service

export type WebSocketMessageType =
  | 'progress'
  | 'status'
  | 'complete'
  | 'error'
  | 'ping'
  | 'pong';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  taskId: string;
  timestamp: number;
  data?: any;
}

export interface ProgressUpdate {
  taskId: string;
  progress: number; // 0-100
  message: string;
  currentStep?: string;
  totalSteps?: number;
  completedSteps?: number;
}

export interface TaskCompletionMessage {
  taskId: string;
  status: 'completed' | 'failed';
  result?: any;
  error?: string;
  duration: number; // milliseconds
}

// In-memory connection store
// In production, use Redis or similar for multi-instance support
const connections = new Map<string, Set<any>>();
const taskSubscriptions = new Map<string, Set<string>>();

/**
 * Subscribe a connection to task updates
 */
export function subscribeToTask(taskId: string, connectionId: string, send: (message: WebSocketMessage) => void) {
  // Add connection to task subscriptions
  if (!taskSubscriptions.has(taskId)) {
    taskSubscriptions.set(taskId, new Set());
  }
  taskSubscriptions.get(taskId)!.add(connectionId);

  // Store send function for this connection
  if (!connections.has(connectionId)) {
    connections.set(connectionId, new Set());
  }

  // Send initial status
  send({
    type: 'status',
    taskId,
    timestamp: Date.now(),
    data: { message: 'Subscribed to task updates' },
  });
}

/**
 * Unsubscribe a connection from task updates
 */
export function unsubscribeFromTask(taskId: string, connectionId: string) {
  const subscribers = taskSubscriptions.get(taskId);
  if (subscribers) {
    subscribers.delete(connectionId);
    if (subscribers.size === 0) {
      taskSubscriptions.delete(taskId);
    }
  }

  connections.delete(connectionId);
}

/**
 * Broadcast progress update to all subscribers of a task
 */
export function broadcastProgress(update: ProgressUpdate, sendToConnection: (connectionId: string, message: WebSocketMessage) => void) {
  const subscribers = taskSubscriptions.get(update.taskId);
  if (!subscribers || subscribers.size === 0) {
    return;
  }

  const message: WebSocketMessage = {
    type: 'progress',
    taskId: update.taskId,
    timestamp: Date.now(),
    data: update,
  };

  for (const connectionId of subscribers) {
    try {
      sendToConnection(connectionId, message);
    } catch (error) {
      console.error(`[WebSocket] Failed to send to ${connectionId}:`, error);
      // Remove dead connection
      subscribers.delete(connectionId);
      connections.delete(connectionId);
    }
  }
}

/**
 * Broadcast task completion to all subscribers
 */
export function broadcastCompletion(completion: TaskCompletionMessage, sendToConnection: (connectionId: string, message: WebSocketMessage) => void) {
  const subscribers = taskSubscriptions.get(completion.taskId);
  if (!subscribers || subscribers.size === 0) {
    return;
  }

  const message: WebSocketMessage = {
    type: 'complete',
    taskId: completion.taskId,
    timestamp: Date.now(),
    data: completion,
  };

  for (const connectionId of subscribers) {
    try {
      sendToConnection(connectionId, message);
    } catch (error) {
      console.error(`[WebSocket] Failed to send completion to ${connectionId}:`, error);
    }
  }

  // Clean up subscribers after completion
  setTimeout(() => {
    taskSubscriptions.delete(completion.taskId);
  }, 5000); // 5 second grace period
}

/**
 * Broadcast error to all subscribers
 */
export function broadcastError(taskId: string, error: string, sendToConnection: (connectionId: string, message: WebSocketMessage) => void) {
  const subscribers = taskSubscriptions.get(taskId);
  if (!subscribers || subscribers.size === 0) {
    return;
  }

  const message: WebSocketMessage = {
    type: 'error',
    taskId,
    timestamp: Date.now(),
    data: { error },
  };

  for (const connectionId of subscribers) {
    try {
      sendToConnection(connectionId, message);
    } catch (error) {
      console.error(`[WebSocket] Failed to send error to ${connectionId}:`, error);
    }
  }
}

/**
 * Send heartbeat/ping to connection
 */
export function sendPing(connectionId: string, send: (message: WebSocketMessage) => void) {
  send({
    type: 'ping',
    taskId: '', // Not task-specific
    timestamp: Date.now(),
  });
}

/**
 * Get connection count for a task
 */
export function getSubscriberCount(taskId: string): number {
  return taskSubscriptions.get(taskId)?.size || 0;
}

/**
 * Get all active connections
 */
export function getActiveConnections(): number {
  return connections.size;
}

/**
 * Clean up dead connections
 */
export function cleanupDeadConnections(isAlive: (connectionId: string) => boolean) {
  const deadConnections: string[] = [];

  for (const connectionId of connections.keys()) {
    if (!isAlive(connectionId)) {
      deadConnections.push(connectionId);
    }
  }

  for (const connectionId of deadConnections) {
    // Remove from all task subscriptions
    for (const [taskId, subscribers] of taskSubscriptions.entries()) {
      subscribers.delete(connectionId);
      if (subscribers.size === 0) {
        taskSubscriptions.delete(taskId);
      }
    }

    connections.delete(connectionId);
  }

  return deadConnections.length;
}

/**
 * Utility: Simulate progress updates (for testing)
 */
export async function simulateProgress(
  taskId: string,
  steps: string[],
  sendToConnection: (connectionId: string, message: WebSocketMessage) => void
): Promise<void> {
  const totalSteps = steps.length;

  for (let i = 0; i < totalSteps; i++) {
    const progress = Math.round(((i + 1) / totalSteps) * 100);

    broadcastProgress(
      {
        taskId,
        progress,
        message: steps[i],
        currentStep: steps[i],
        totalSteps,
        completedSteps: i + 1,
      },
      sendToConnection
    );

    // Wait a bit between steps
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Send completion
  broadcastCompletion(
    {
      taskId,
      status: 'completed',
      result: { success: true, steps: totalSteps },
      duration: totalSteps * 500,
    },
    sendToConnection
  );
}
