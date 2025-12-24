/**
 * E2E Tests for Mobile Session Management
 * Tests the complete mobile authentication and command execution flow:
 * - QR code pairing
 * - Session creation
 * - Token management
 * - Command execution via mobile API
 * - Session refresh
 * - Session deletion
 */

import { test, expect } from '@playwright/test';

test.describe('Mobile Session Flow', () => {
  let deviceId: string;
  let pairingCode: string;
  let sessionToken: string;
  let sessionId: string;

  test.beforeEach(async ({ page }) => {
    deviceId = `test-device-${Date.now()}`;
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should generate QR pairing code', async ({ page, request }) => {
    // Request pairing code
    const response = await request.get(
      `http://localhost:3000/api/mobile/auth/pairing?deviceId=${deviceId}`
    );

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.pairingCode).toMatch(/^\d{6}$/);
    expect(data.data.expiresIn).toBe(300); // 5 minutes

    pairingCode = data.data.pairingCode;
  });

  test('should create session with valid pairing code', async ({ request }) => {
    // First get a pairing code
    const pairingResponse = await request.get(
      `http://localhost:3000/api/mobile/auth/pairing?deviceId=${deviceId}`
    );
    const pairingData = await pairingResponse.json();
    pairingCode = pairingData.data.pairingCode;

    // Create session with pairing code
    const sessionResponse = await request.post(
      'http://localhost:3000/api/mobile/auth/session',
      {
        data: {
          deviceId,
          deviceName: 'E2E Test Device',
          pairingCode,
          metadata: {
            userAgent: 'Playwright Test',
            platform: 'test',
            appVersion: '1.0.0',
          },
        },
      }
    );

    expect(sessionResponse.ok()).toBeTruthy();

    const data = await sessionResponse.json();
    expect(data.success).toBe(true);
    expect(data.data.token).toBeTruthy();
    expect(data.data.sessionId).toBeTruthy();
    expect(data.data.expiresAt).toBeGreaterThan(Date.now());

    sessionToken = data.data.token;
    sessionId = data.data.sessionId;
  });

  test('should reject session creation with invalid pairing code', async ({ request }) => {
    const sessionResponse = await request.post(
      'http://localhost:3000/api/mobile/auth/session',
      {
        data: {
          deviceId,
          deviceName: 'E2E Test Device',
          pairingCode: '999999', // Invalid code
        },
      }
    );

    expect(sessionResponse.status()).toBe(400);

    const data = await sessionResponse.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeTruthy();
  });

  test('should reject session creation with expired pairing code', async ({ request }) => {
    // This test would require mocking time or waiting 5 minutes
    // For now, we'll test the validation logic
    const sessionResponse = await request.post(
      'http://localhost:3000/api/mobile/auth/session',
      {
        data: {
          deviceId,
          deviceName: 'E2E Test Device',
          pairingCode: '123456', // Likely expired or non-existent
        },
      }
    );

    expect(sessionResponse.status()).toBe(400);
  });

  test('should validate token and get session info', async ({ request }) => {
    // Create session first
    const pairingResponse = await request.get(
      `http://localhost:3000/api/mobile/auth/pairing?deviceId=${deviceId}`
    );
    const pairingData = await pairingResponse.json();
    const code = pairingData.data.pairingCode;

    const sessionResponse = await request.post(
      'http://localhost:3000/api/mobile/auth/session',
      {
        data: {
          deviceId,
          deviceName: 'E2E Test Device',
          pairingCode: code,
        },
      }
    );
    const sessionData = await sessionResponse.json();
    const token = sessionData.data.token;

    // Validate token by making an authenticated request
    const statusResponse = await request.get(
      'http://localhost:3000/api/mobile/status?project=HEPHAITOS',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    expect(statusResponse.ok()).toBeTruthy();
    const statusData = await statusResponse.json();
    expect(statusData.success).toBe(true);
  });

  test('should refresh token before expiry', async ({ request }) => {
    // Create session
    const pairingResponse = await request.get(
      `http://localhost:3000/api/mobile/auth/pairing?deviceId=${deviceId}`
    );
    const pairingData = await pairingResponse.json();
    const code = pairingData.data.pairingCode;

    const sessionResponse = await request.post(
      'http://localhost:3000/api/mobile/auth/session',
      {
        data: {
          deviceId,
          deviceName: 'E2E Test Device',
          pairingCode: code,
        },
      }
    );
    const sessionData = await sessionResponse.json();
    const oldToken = sessionData.data.token;

    // Refresh token
    const refreshResponse = await request.post(
      'http://localhost:3000/api/mobile/auth/refresh',
      {
        data: {
          token: oldToken,
        },
      }
    );

    expect(refreshResponse.ok()).toBeTruthy();

    const refreshData = await refreshResponse.json();
    expect(refreshData.success).toBe(true);
    expect(refreshData.data.token).toBeTruthy();
    expect(refreshData.data.sessionId).toBe(sessionData.data.sessionId);
    expect(refreshData.data.expiresAt).toBeGreaterThan(Date.now());
  });

  test('should delete session and invalidate token', async ({ request }) => {
    // Create session
    const pairingResponse = await request.get(
      `http://localhost:3000/api/mobile/auth/pairing?deviceId=${deviceId}`
    );
    const pairingData = await pairingResponse.json();
    const code = pairingData.data.pairingCode;

    const sessionResponse = await request.post(
      'http://localhost:3000/api/mobile/auth/session',
      {
        data: {
          deviceId,
          deviceName: 'E2E Test Device',
          pairingCode: code,
        },
      }
    );
    const sessionData = await sessionResponse.json();
    const token = sessionData.data.token;
    const sessId = sessionData.data.sessionId;

    // Delete session
    const deleteResponse = await request.delete(
      `http://localhost:3000/api/mobile/auth/session?sessionId=${sessId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    expect(deleteResponse.ok()).toBeTruthy();

    const deleteData = await deleteResponse.json();
    expect(deleteData.success).toBe(true);

    // Try to use token after deletion (should fail)
    const statusResponse = await request.get(
      'http://localhost:3000/api/mobile/status?project=HEPHAITOS',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    expect(statusResponse.status()).toBe(401);
  });
});

test.describe('Mobile Command Execution', () => {
  let sessionToken: string;

  test.beforeEach(async ({ request }) => {
    const deviceId = `test-device-${Date.now()}`;

    // Create session for all tests
    const pairingResponse = await request.get(
      `http://localhost:3000/api/mobile/auth/pairing?deviceId=${deviceId}`
    );
    const pairingData = await pairingResponse.json();
    const code = pairingData.data.pairingCode;

    const sessionResponse = await request.post(
      'http://localhost:3000/api/mobile/auth/session',
      {
        data: {
          deviceId,
          deviceName: 'E2E Test Device',
          pairingCode: code,
        },
      }
    );
    const sessionData = await sessionResponse.json();
    sessionToken = sessionData.data.token;
  });

  test('should execute status command', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/claude/commands', {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
      data: {
        command: 'status',
        params: {},
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.taskId).toMatch(/^task-/);
    expect(data.status).toBe('completed');
    expect(data.data).toBeDefined();
  });

  test('should execute next command with count', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/claude/commands', {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
      data: {
        command: 'next',
        params: { count: 3 },
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.tasksQueued).toBe(3);
    expect(data.data.tasks).toHaveLength(3);
  });

  test('should execute commit_push command', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/claude/commands', {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
      data: {
        command: 'commit_push',
        params: {},
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
  });

  test('should execute code_review command', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/claude/commands', {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
      data: {
        command: 'code_review',
        params: {},
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.lintErrors).toBeDefined();
  });

  test('should execute test command', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/claude/commands', {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
      data: {
        command: 'test',
        params: {},
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.totalTests).toBeDefined();
  });

  test('should execute deploy command', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/claude/commands', {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
      data: {
        command: 'deploy',
        params: {},
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.deploymentId).toBeDefined();
  });

  test('should execute context switch to HEPHAITOS', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/claude/commands', {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
      data: {
        command: 'hephaitos',
        params: { submenu: '빌더' },
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.project).toBe('HEPHAITOS');
    expect(data.data.submenu).toBe('빌더');
  });

  test('should execute context switch to BIDFLOW', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/claude/commands', {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
      data: {
        command: 'bidflow',
        params: { submenu: '리드' },
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.project).toBe('BIDFLOW');
    expect(data.data.submenu).toBe('리드');
  });

  test('should query task status', async ({ request }) => {
    // Execute a command first
    const commandResponse = await request.post('http://localhost:3000/api/claude/commands', {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
      data: {
        command: 'status',
        params: {},
      },
    });
    const commandData = await commandResponse.json();
    const taskId = commandData.taskId;

    // Query task status
    const statusResponse = await request.get(
      `http://localhost:3000/api/claude/commands?taskId=${taskId}`,
      {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      }
    );

    expect(statusResponse.ok()).toBeTruthy();

    const statusData = await statusResponse.json();
    expect(statusData.success).toBe(true);
    expect(statusData.data.taskId).toBe(taskId);
    expect(statusData.data.command).toBe('status');
    expect(statusData.data.status).toBe('completed');
  });

  test('should reject unauthorized command execution', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/claude/commands', {
      // No Authorization header
      data: {
        command: 'status',
        params: {},
      },
    });

    expect(response.status()).toBe(401);
  });

  test('should reject invalid command', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/claude/commands', {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
      data: {
        command: 'invalid_command',
        params: {},
      },
    });

    expect(response.status()).toBe(400);
  });
});

test.describe('Mobile Status Endpoint', () => {
  test('should get lightweight status', async ({ request }) => {
    const response = await request.get(
      'http://localhost:3000/api/mobile/status?project=HEPHAITOS'
    );

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.project).toBe('HEPHAITOS');
    expect(data.data.completion).toBeGreaterThanOrEqual(0);
    expect(data.data.completion).toBeLessThanOrEqual(100);
    expect(data.data.currentTask).toBeTruthy();
    expect(data.data.stats).toBeDefined();
    expect(data.data.stats.todayCommits).toBeGreaterThanOrEqual(0);
    expect(data.data.stats.tasksCompleted).toBeGreaterThanOrEqual(0);
    expect(data.data.stats.tasksRemaining).toBeGreaterThanOrEqual(0);
    expect(data.data.shortcuts).toBeInstanceOf(Array);

    // Check payload size (should be < 2KB)
    const responseText = await response.text();
    const payloadSize = new Blob([responseText]).size;
    expect(payloadSize).toBeLessThan(2048); // 2KB
  });

  test('should use cache for repeated status requests', async ({ request }) => {
    // First request
    const response1 = await request.get(
      'http://localhost:3000/api/mobile/status?project=HEPHAITOS'
    );
    const data1 = await response1.json();

    // Second request within cache TTL (5s)
    const response2 = await request.get(
      'http://localhost:3000/api/mobile/status?project=HEPHAITOS'
    );
    const data2 = await response2.json();

    // Should return cached data
    expect(data2.cached).toBe(true);
    expect(data2.data.completion).toBe(data1.data.completion);
  });

  test('should handle BIDFLOW project status', async ({ request }) => {
    const response = await request.get(
      'http://localhost:3000/api/mobile/status?project=BIDFLOW'
    );

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.project).toBe('BIDFLOW');
  });

  test('should default to HEPHAITOS if project not specified', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/mobile/status');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.project).toBe('HEPHAITOS');
  });
});

test.describe('End-to-End Mobile Flow', () => {
  test('should complete full mobile authentication and command flow', async ({ request }) => {
    const deviceId = `e2e-test-${Date.now()}`;

    // 1. Generate pairing code
    const pairingResponse = await request.get(
      `http://localhost:3000/api/mobile/auth/pairing?deviceId=${deviceId}`
    );
    expect(pairingResponse.ok()).toBeTruthy();
    const pairingData = await pairingResponse.json();
    const pairingCode = pairingData.data.pairingCode;
    expect(pairingCode).toMatch(/^\d{6}$/);

    // 2. Create session with pairing code
    const sessionResponse = await request.post(
      'http://localhost:3000/api/mobile/auth/session',
      {
        data: {
          deviceId,
          deviceName: 'E2E Test Device',
          pairingCode,
          metadata: {
            userAgent: 'Claude/1.0.0',
            platform: 'ios',
            appVersion: '1.0.0',
          },
        },
      }
    );
    expect(sessionResponse.ok()).toBeTruthy();
    const sessionData = await sessionResponse.json();
    const token = sessionData.data.token;
    const sessionId = sessionData.data.sessionId;

    // 3. Execute command with session token
    const commandResponse = await request.post('http://localhost:3000/api/claude/commands', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        command: 'next',
        params: { count: 2 },
      },
    });
    expect(commandResponse.ok()).toBeTruthy();
    const commandData = await commandResponse.json();
    expect(commandData.success).toBe(true);
    expect(commandData.data.tasksQueued).toBe(2);

    // 4. Check task status
    const statusResponse = await request.get(
      `http://localhost:3000/api/claude/commands?taskId=${commandData.taskId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    expect(statusResponse.ok()).toBeTruthy();
    const statusData = await statusResponse.json();
    expect(statusData.data.status).toBe('completed');

    // 5. Refresh token
    const refreshResponse = await request.post(
      'http://localhost:3000/api/mobile/auth/refresh',
      {
        data: { token },
      }
    );
    expect(refreshResponse.ok()).toBeTruthy();
    const refreshData = await refreshResponse.json();
    const newToken = refreshData.data.token;

    // 6. Use new token
    const newCommandResponse = await request.post('http://localhost:3000/api/claude/commands', {
      headers: {
        Authorization: `Bearer ${newToken}`,
      },
      data: {
        command: 'status',
        params: {},
      },
    });
    expect(newCommandResponse.ok()).toBeTruthy();

    // 7. Delete session
    const deleteResponse = await request.delete(
      `http://localhost:3000/api/mobile/auth/session?sessionId=${sessionId}`,
      {
        headers: {
          Authorization: `Bearer ${newToken}`,
        },
      }
    );
    expect(deleteResponse.ok()).toBeTruthy();

    // 8. Verify token is invalidated
    const invalidResponse = await request.get('http://localhost:3000/api/mobile/status', {
      headers: {
        Authorization: `Bearer ${newToken}`,
      },
    });
    expect(invalidResponse.status()).toBe(401);
  });
});
