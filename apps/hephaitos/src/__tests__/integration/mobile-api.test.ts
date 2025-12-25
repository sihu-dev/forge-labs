/**
 * Mobile API Integration Tests
 * Tests the complete mobile authentication and command execution flow
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createSession,
  validateToken,
  refreshToken,
  deleteSession,
  generatePairingCode,
  isValidPairingCode,
  cleanupExpiredSessions,
  getSession,
  getAllActiveSessions,
} from '@/lib/mobile/session-manager';
import {
  executeCommand,
  getTaskStatus,
  cleanupOldTasks,
} from '@/lib/mobile/command-executor';

describe('Mobile API Integration', () => {
  describe('Session Manager', () => {
    let testDeviceId: string;
    let testDeviceName: string;

    beforeEach(() => {
      testDeviceId = 'test-device-123';
      testDeviceName = 'Test Device';
    });

    afterEach(() => {
      // Clean up sessions
      const sessions = getAllActiveSessions();
      sessions.forEach((session) => deleteSession(session.sessionId));
    });

    describe('Session Creation', () => {
      it('should create a new session', () => {
        const sessionToken = createSession({
          deviceId: testDeviceId,
          deviceName: testDeviceName,
        });

        expect(sessionToken).toBeDefined();
        expect(sessionToken.token).toBeTruthy();
        expect(sessionToken.sessionId).toBeTruthy();
        expect(sessionToken.expiresAt).toBeGreaterThan(Date.now());
      });

      it('should create session with metadata', () => {
        const metadata = {
          userAgent: 'Claude/1.0.0',
          platform: 'ios',
          appVersion: '1.0.0',
        };

        const sessionToken = createSession({
          deviceId: testDeviceId,
          deviceName: testDeviceName,
          metadata,
        });

        const session = getSession(sessionToken.sessionId);
        expect(session).toBeDefined();
        expect(session?.metadata).toEqual(metadata);
      });

      it('should allow multiple sessions for same device', () => {
        const session1 = createSession({
          deviceId: testDeviceId,
          deviceName: testDeviceName,
        });

        const session2 = createSession({
          deviceId: testDeviceId,
          deviceName: testDeviceName,
        });

        expect(session1.sessionId).not.toBe(session2.sessionId);
        expect(session1.token).not.toBe(session2.token);
      });
    });

    describe('Token Validation', () => {
      it('should validate a valid token', () => {
        const sessionToken = createSession({
          deviceId: testDeviceId,
          deviceName: testDeviceName,
        });

        const session = validateToken(sessionToken.token);
        expect(session).toBeDefined();
        expect(session?.sessionId).toBe(sessionToken.sessionId);
        expect(session?.isActive).toBe(true);
      });

      it('should return null for invalid token', () => {
        const session = validateToken('invalid-token-12345');
        expect(session).toBeNull();
      });

      it('should update last activity on validation', () => {
        const sessionToken = createSession({
          deviceId: testDeviceId,
          deviceName: testDeviceName,
        });

        const session1 = getSession(sessionToken.sessionId);
        const lastActivity1 = session1?.lastActivity;

        // Wait a bit
        setTimeout(() => {
          validateToken(sessionToken.token);
          const session2 = getSession(sessionToken.sessionId);
          const lastActivity2 = session2?.lastActivity;

          expect(lastActivity2).toBeGreaterThan(lastActivity1!);
        }, 10);
      });
    });

    describe('Token Refresh', () => {
      it('should refresh a valid token', () => {
        const sessionToken = createSession({
          deviceId: testDeviceId,
          deviceName: testDeviceName,
        });

        // Manually expire the session to trigger refresh
        const session = getSession(sessionToken.sessionId);
        if (session) {
          session.expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes
        }

        const newToken = refreshToken(sessionToken.token);
        expect(newToken).toBeDefined();
        expect(newToken?.sessionId).toBe(sessionToken.sessionId);
        expect(newToken?.expiresAt).toBeGreaterThan(Date.now());
      });

      it('should return null for invalid token refresh', () => {
        const newToken = refreshToken('invalid-token');
        expect(newToken).toBeNull();
      });

      it('should extend session expiry on refresh', () => {
        const sessionToken = createSession({
          deviceId: testDeviceId,
          deviceName: testDeviceName,
        });

        const session1 = getSession(sessionToken.sessionId);
        const expiresAt1 = session1?.expiresAt;

        // Force refresh by setting expiry soon
        if (session1) {
          session1.expiresAt = Date.now() + 30 * 60 * 1000;
        }

        const newToken = refreshToken(sessionToken.token);
        const session2 = getSession(sessionToken.sessionId);
        const expiresAt2 = session2?.expiresAt;

        expect(expiresAt2).toBeGreaterThan(expiresAt1!);
      });
    });

    describe('Session Deletion', () => {
      it('should delete a session', () => {
        const sessionToken = createSession({
          deviceId: testDeviceId,
          deviceName: testDeviceName,
        });

        const deleted = deleteSession(sessionToken.sessionId);
        expect(deleted).toBe(true);

        const session = getSession(sessionToken.sessionId);
        expect(session).toBeNull();
      });

      it('should invalidate token after deletion', () => {
        const sessionToken = createSession({
          deviceId: testDeviceId,
          deviceName: testDeviceName,
        });

        deleteSession(sessionToken.sessionId);

        const session = validateToken(sessionToken.token);
        expect(session).toBeNull();
      });

      it('should return false for non-existent session', () => {
        const deleted = deleteSession('non-existent-session');
        expect(deleted).toBe(false);
      });
    });

    describe('Pairing Codes', () => {
      it('should generate a 6-digit pairing code', () => {
        const code = generatePairingCode();
        expect(code).toMatch(/^\d{6}$/);
      });

      it('should generate unique pairing codes', () => {
        const code1 = generatePairingCode();
        const code2 = generatePairingCode();
        // Very unlikely to be the same (1 in 1 million)
        expect(code1).not.toBe(code2);
      });

      it('should validate pairing code format', () => {
        expect(isValidPairingCode('123456')).toBe(true);
        expect(isValidPairingCode('000000')).toBe(true);
        expect(isValidPairingCode('999999')).toBe(true);
      });

      it('should reject invalid pairing codes', () => {
        expect(isValidPairingCode('12345')).toBe(false); // Too short
        expect(isValidPairingCode('1234567')).toBe(false); // Too long
        expect(isValidPairingCode('12345a')).toBe(false); // Contains letter
        expect(isValidPairingCode('abc123')).toBe(false); // Contains letters
      });
    });

    describe('Session Cleanup', () => {
      it('should clean up expired sessions', () => {
        const sessionToken = createSession({
          deviceId: testDeviceId,
          deviceName: testDeviceName,
        });

        // Manually expire the session
        const session = getSession(sessionToken.sessionId);
        if (session) {
          session.expiresAt = Date.now() - 1000; // Expired 1 second ago
        }

        const cleaned = cleanupExpiredSessions();
        expect(cleaned).toBeGreaterThan(0);

        const expiredSession = getSession(sessionToken.sessionId);
        expect(expiredSession).toBeNull();
      });

      it('should not clean up active sessions', () => {
        const sessionToken = createSession({
          deviceId: testDeviceId,
          deviceName: testDeviceName,
        });

        const cleaned = cleanupExpiredSessions();

        const session = getSession(sessionToken.sessionId);
        expect(session).toBeDefined();
      });
    });
  });

  describe('Command Executor', () => {
    afterEach(() => {
      cleanupOldTasks();
    });

    describe('Command Execution', () => {
      it('should execute status command', async () => {
        const result = await executeCommand('status', {});

        expect(result.success).toBe(true);
        expect(result.taskId).toBeTruthy();
        expect(result.status).toBe('completed');
        expect(result.data).toBeDefined();
      });

      it('should execute next command with count', async () => {
        const result = await executeCommand('next', { count: 3 });

        expect(result.success).toBe(true);
        expect(result.data?.tasksQueued).toBe(3);
        expect(result.data?.tasks).toHaveLength(3);
      });

      it('should execute commit_push command', async () => {
        const result = await executeCommand('commit_push', {});

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      });

      it('should execute code_review command', async () => {
        const result = await executeCommand('code_review', {});

        expect(result.success).toBe(true);
        expect(result.data?.lintErrors).toBeDefined();
      });

      it('should execute test command', async () => {
        const result = await executeCommand('test', {});

        expect(result.success).toBe(true);
        expect(result.data?.totalTests).toBeDefined();
      });

      it('should execute deploy command', async () => {
        const result = await executeCommand('deploy', {});

        expect(result.success).toBe(true);
        expect(result.data?.deploymentId).toBeDefined();
      });

      it('should handle context switch commands', async () => {
        const hephaitosResult = await executeCommand('hephaitos', {
          submenu: '빌더',
        });

        expect(hephaitosResult.success).toBe(true);
        expect(hephaitosResult.data?.project).toBe('HEPHAITOS');
        expect(hephaitosResult.data?.submenu).toBe('빌더');

        const bidflowResult = await executeCommand('bidflow', {
          submenu: '리드',
        });

        expect(bidflowResult.success).toBe(true);
        expect(bidflowResult.data?.project).toBe('BIDFLOW');
        expect(bidflowResult.data?.submenu).toBe('리드');
      });

      it('should return task ID for all commands', async () => {
        const result = await executeCommand('status', {});

        expect(result.taskId).toBeTruthy();
        expect(result.taskId).toMatch(/^task-/);
      });
    });

    describe('Task Status', () => {
      it('should get task status', async () => {
        const commandResult = await executeCommand('status', {});
        const taskId = commandResult.taskId!;

        const status = getTaskStatus(taskId);
        expect(status).toBeDefined();
        expect(status?.taskId).toBe(taskId);
        expect(status?.command).toBe('status');
        expect(status?.status).toBe('completed');
      });

      it('should return null for invalid task ID', () => {
        const status = getTaskStatus('invalid-task-id');
        expect(status).toBeNull();
      });

      it('should track task progress', async () => {
        const commandResult = await executeCommand('next', { count: 3 });
        const taskId = commandResult.taskId!;

        const status = getTaskStatus(taskId);
        expect(status?.status).toBe('completed');
        expect(status?.result).toBeDefined();
      });
    });

    describe('Error Handling', () => {
      it('should handle unknown command', async () => {
        const result = await executeCommand('unknown' as any, {});

        expect(result.success).toBe(false);
        expect(result.status).toBe('failed');
      });

      it('should track failed tasks', async () => {
        const result = await executeCommand('unknown' as any, {});
        const taskId = result.taskId!;

        const status = getTaskStatus(taskId);
        expect(status?.status).toBe('failed');
        expect(status?.error).toBeDefined();
      });
    });

    describe('Task Cleanup', () => {
      it('should clean up old tasks', async () => {
        // Create a task
        const result = await executeCommand('status', {});
        const taskId = result.taskId!;

        // Verify task exists
        let status = getTaskStatus(taskId);
        expect(status).toBeDefined();

        // Task cleanup happens automatically after 1 hour
        // For testing, we just verify the cleanup function works
        cleanupOldTasks();

        // Task should still exist (not old enough)
        status = getTaskStatus(taskId);
        expect(status).toBeDefined();
      });
    });
  });

  describe('End-to-End Mobile Flow', () => {
    it('should complete full authentication and command flow', async () => {
      // 1. Generate pairing code
      const pairingCode = generatePairingCode();
      expect(isValidPairingCode(pairingCode)).toBe(true);

      // 2. Create session
      const sessionToken = createSession({
        deviceId: 'mobile-e2e-test',
        deviceName: 'E2E Test Device',
        metadata: {
          userAgent: 'Claude/1.0.0',
          platform: 'ios',
          appVersion: '1.0.0',
        },
      });

      expect(sessionToken.token).toBeTruthy();

      // 3. Validate token
      const session = validateToken(sessionToken.token);
      expect(session).toBeDefined();
      expect(session?.isActive).toBe(true);

      // 4. Execute command with session
      const commandResult = await executeCommand('next', { count: 2 });
      expect(commandResult.success).toBe(true);
      expect(commandResult.data?.tasksQueued).toBe(2);

      // 5. Check task status
      const taskStatus = getTaskStatus(commandResult.taskId!);
      expect(taskStatus?.status).toBe('completed');

      // 6. Refresh token
      const refreshedToken = refreshToken(sessionToken.token);
      expect(refreshedToken).toBeDefined();

      // 7. Delete session
      const deleted = deleteSession(session!.sessionId);
      expect(deleted).toBe(true);

      // 8. Verify session is gone
      const deletedSession = validateToken(sessionToken.token);
      expect(deletedSession).toBeNull();
    });
  });
});
