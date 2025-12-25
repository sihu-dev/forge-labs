/**
 * Mobile Session Manager
 * Manages sessions for mobile Claude app connections
 *
 * Features:
 * - Session token generation and validation
 * - Auto-refresh before expiry
 * - Offline command queueing (IndexedDB)
 * - Reconnection handling
 */

import crypto from 'crypto';

// ============================================
// Types
// ============================================

export interface MobileSession {
  sessionId: string;
  deviceId: string;
  deviceName: string;
  createdAt: number;
  expiresAt: number;
  lastActivity: number;
  isActive: boolean;
  metadata?: {
    userAgent?: string;
    platform?: string;
    appVersion?: string;
  };
}

export interface SessionToken {
  token: string;
  sessionId: string;
  expiresAt: number;
}

// ============================================
// In-memory session store
// In production, use Redis or similar
// ============================================

const sessions = new Map<string, MobileSession>();
const tokenToSessionMap = new Map<string, string>();

// Session configuration
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours
const TOKEN_REFRESH_THRESHOLD = 60 * 60 * 1000; // 1 hour before expiry

// ============================================
// Session Management
// ============================================

/**
 * Create a new mobile session
 */
export function createSession(params: {
  deviceId: string;
  deviceName: string;
  metadata?: MobileSession['metadata'];
}): SessionToken {
  const sessionId = generateSessionId();
  const token = generateToken();
  const now = Date.now();
  const expiresAt = now + SESSION_TTL;

  const session: MobileSession = {
    sessionId,
    deviceId: params.deviceId,
    deviceName: params.deviceName,
    createdAt: now,
    expiresAt,
    lastActivity: now,
    isActive: true,
    metadata: params.metadata,
  };

  sessions.set(sessionId, session);
  tokenToSessionMap.set(token, sessionId);

  // Clean up expired sessions
  cleanupExpiredSessions();

  return {
    token,
    sessionId,
    expiresAt,
  };
}

/**
 * Validate a session token
 */
export function validateToken(token: string): MobileSession | null {
  const sessionId = tokenToSessionMap.get(token);
  if (!sessionId) {
    return null;
  }

  const session = sessions.get(sessionId);
  if (!session) {
    tokenToSessionMap.delete(token);
    return null;
  }

  // Check if session is expired
  if (session.expiresAt < Date.now()) {
    deleteSession(sessionId);
    tokenToSessionMap.delete(token);
    return null;
  }

  // Check if session is active
  if (!session.isActive) {
    return null;
  }

  // Update last activity
  session.lastActivity = Date.now();

  return session;
}

/**
 * Refresh a session token
 */
export function refreshToken(oldToken: string): SessionToken | null {
  const session = validateToken(oldToken);
  if (!session) {
    return null;
  }

  // Check if token needs refresh
  const timeUntilExpiry = session.expiresAt - Date.now();
  if (timeUntilExpiry > TOKEN_REFRESH_THRESHOLD) {
    // Token is still valid for a while, return existing
    return {
      token: oldToken,
      sessionId: session.sessionId,
      expiresAt: session.expiresAt,
    };
  }

  // Generate new token
  const newToken = generateToken();
  const newExpiresAt = Date.now() + SESSION_TTL;

  // Update session
  session.expiresAt = newExpiresAt;
  session.lastActivity = Date.now();

  // Update token mapping
  tokenToSessionMap.delete(oldToken);
  tokenToSessionMap.set(newToken, session.sessionId);

  return {
    token: newToken,
    sessionId: session.sessionId,
    expiresAt: newExpiresAt,
  };
}

/**
 * Get session by ID
 */
export function getSession(sessionId: string): MobileSession | null {
  return sessions.get(sessionId) || null;
}

/**
 * Delete a session
 */
export function deleteSession(sessionId: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) {
    return false;
  }

  // Remove from token map
  for (const [token, sid] of tokenToSessionMap.entries()) {
    if (sid === sessionId) {
      tokenToSessionMap.delete(token);
    }
  }

  // Remove session
  sessions.delete(sessionId);

  return true;
}

/**
 * Deactivate a session (without deleting)
 */
export function deactivateSession(sessionId: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) {
    return false;
  }

  session.isActive = false;
  return true;
}

/**
 * Reactivate a session
 */
export function reactivateSession(sessionId: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) {
    return false;
  }

  // Check if session is expired
  if (session.expiresAt < Date.now()) {
    return false;
  }

  session.isActive = true;
  session.lastActivity = Date.now();
  return true;
}

/**
 * Get all active sessions for a device
 */
export function getDeviceSessions(deviceId: string): MobileSession[] {
  const deviceSessions: MobileSession[] = [];

  for (const session of sessions.values()) {
    if (session.deviceId === deviceId && session.isActive) {
      deviceSessions.push(session);
    }
  }

  return deviceSessions;
}

/**
 * Get all active sessions
 */
export function getAllActiveSessions(): MobileSession[] {
  const activeSessions: MobileSession[] = [];

  for (const session of sessions.values()) {
    if (session.isActive && session.expiresAt > Date.now()) {
      activeSessions.push(session);
    }
  }

  return activeSessions;
}

/**
 * Clean up expired sessions
 */
export function cleanupExpiredSessions(): number {
  let count = 0;
  const now = Date.now();

  for (const [sessionId, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      deleteSession(sessionId);
      count++;
    }
  }

  return count;
}

// ============================================
// Utilities
// ============================================

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
}

/**
 * Generate a secure session token
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate a one-time pairing code (6 digits)
 */
export function generatePairingCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Validate pairing code format
 */
export function isValidPairingCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

// ============================================
// Offline Command Queue
// Client-side only (browser IndexedDB)
// ============================================

/**
 * Client-side offline queue interface
 * This would be implemented in the browser using IndexedDB
 */
export interface OfflineCommand {
  id: string;
  command: string;
  params: any;
  timestamp: number;
  status: 'pending' | 'synced' | 'failed';
}

/**
 * Server-side placeholder for offline queue
 * Actual implementation would be in the client
 */
export const offlineQueue = {
  /**
   * Add command to offline queue
   * (Client-side implementation)
   */
  add: (command: OfflineCommand) => {
    // Implemented in browser
    console.log('[Session Manager] Offline queue add (client-side only):', command);
  },

  /**
   * Get pending commands from offline queue
   * (Client-side implementation)
   */
  getPending: (): OfflineCommand[] => {
    // Implemented in browser
    return [];
  },

  /**
   * Mark command as synced
   * (Client-side implementation)
   */
  markSynced: (id: string) => {
    // Implemented in browser
    console.log('[Session Manager] Offline queue mark synced (client-side only):', id);
  },

  /**
   * Clear synced commands
   * (Client-side implementation)
   */
  clearSynced: () => {
    // Implemented in browser
    console.log('[Session Manager] Offline queue clear synced (client-side only)');
  },
};

// ============================================
// Automatic cleanup every 1 hour
// ============================================

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cleaned = cleanupExpiredSessions();
    if (cleaned > 0) {
      console.log(`[Session Manager] Cleaned up ${cleaned} expired sessions`);
    }
  }, 60 * 60 * 1000); // 1 hour
}
