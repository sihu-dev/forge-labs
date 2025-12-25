/**
 * E2E Tests for Korean Keyboard Shortcuts
 * Tests the Korean keyboard shortcut functionality including:
 * - Individual shortcuts (ㅅ, ㅎ, ㅂ, ㄱ, ㅋ, ㅊ, ㅌ, ㅍ)
 * - Sequence shortcuts (ㄱㄱㄱ)
 * - Submenu modals
 * - Help modal (Shift+?)
 */

import { test, expect } from '@playwright/test';

test.describe('Korean Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should show help modal on Shift+?', async ({ page }) => {
    // Press Shift+?
    await page.keyboard.press('Shift+?');

    // Wait for modal to appear
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Check modal title
    await expect(page.getByText('Keyboard Shortcuts')).toBeVisible();

    // Check for Korean shortcuts tab
    await expect(page.getByRole('tab', { name: /Korean/i })).toBeVisible();

    // Check for English shortcuts tab
    await expect(page.getByRole('tab', { name: /English/i })).toBeVisible();

    // Verify some shortcuts are displayed
    await expect(page.getByText('ㅅ (S)')).toBeVisible();
    await expect(page.getByText('Status')).toBeVisible();

    // Close modal with Escape
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('should handle ㅅ (Status) shortcut', async ({ page }) => {
    // Mock the status API endpoint
    await page.route('**/api/mobile/status*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            project: 'HEPHAITOS',
            completion: 98,
            currentTask: 'E2E Testing',
            currentTaskProgress: 75,
            nextTask: 'WebSocket Deployment',
            nextTaskPriority: 'High',
            stats: {
              todayCommits: 9,
              tasksCompleted: 15,
              tasksRemaining: 2,
              uptime: 3600,
            },
          },
        }),
      });
    });

    // Press ㅅ
    await page.keyboard.press('ㅅ');

    // Should navigate to status page
    await expect(page).toHaveURL(/\/dashboard\/status/);

    // Verify status page content
    await expect(page.getByText('System Status')).toBeVisible();
    await expect(page.getByText('HEPHAITOS')).toBeVisible();
    await expect(page.getByText('98%')).toBeVisible();
  });

  test('should handle ㅎ (HEPHAITOS) submenu shortcut', async ({ page }) => {
    // Press ㅎ
    await page.keyboard.press('ㅎ');

    // Wait for submenu modal
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Check modal title
    await expect(page.getByText(/HEPHAITOS/i)).toBeVisible();

    // Verify submenu options
    await expect(page.getByText(/빌더/)).toBeVisible();
    await expect(page.getByText(/백테스트/)).toBeVisible();
    await expect(page.getByText(/거래소/)).toBeVisible();

    // Close modal
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('should handle ㅂ (BIDFLOW) submenu shortcut', async ({ page }) => {
    // Press ㅂ
    await page.keyboard.press('ㅂ');

    // Wait for submenu modal
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Check modal title
    await expect(page.getByText(/BIDFLOW/i)).toBeVisible();

    // Verify submenu options
    await expect(page.getByText(/리드/)).toBeVisible();
    await expect(page.getByText(/캠페인/)).toBeVisible();
    await expect(page.getByText(/입찰/)).toBeVisible();

    // Close modal
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('should handle ㄱ (Next Task) shortcut', async ({ page }) => {
    // Mock the command execution API
    await page.route('**/api/claude/commands', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            taskId: 'task-123',
            message: 'Task queued successfully',
            data: {
              tasksQueued: 1,
              tasks: ['Next priority task'],
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Press ㄱ
    await page.keyboard.press('ㄱ');

    // Wait for toast notification
    await expect(page.getByText(/Task queued/i)).toBeVisible({ timeout: 5000 });
  });

  test('should handle ㄱㄱㄱ (3 Sequential Tasks) sequence', async ({ page }) => {
    // Mock the command execution API
    let callCount = 0;
    await page.route('**/api/claude/commands', async (route) => {
      if (route.request().method() === 'POST') {
        callCount++;
        const body = await route.request().postDataJSON();

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            taskId: `task-${callCount}`,
            message: 'Tasks queued successfully',
            data: {
              tasksQueued: body.params?.count || 1,
              tasks: Array(body.params?.count || 1).fill('Task'),
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Press ㄱ three times in quick succession (within 800ms)
    await page.keyboard.press('ㄱ');
    await page.waitForTimeout(200);
    await page.keyboard.press('ㄱ');
    await page.waitForTimeout(200);
    await page.keyboard.press('ㄱ');

    // Wait for toast notification showing 3 tasks
    await expect(page.getByText(/3.*tasks/i)).toBeVisible({ timeout: 5000 });
  });

  test('should handle English fallback (s for Status)', async ({ page }) => {
    // Mock the status API
    await page.route('**/api/mobile/status*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            project: 'HEPHAITOS',
            completion: 98,
            stats: {
              todayCommits: 9,
              tasksCompleted: 15,
              tasksRemaining: 2,
              uptime: 3600,
            },
          },
        }),
      });
    });

    // Press 's' (English fallback for ㅅ)
    await page.keyboard.press('s');

    // Should navigate to status page
    await expect(page).toHaveURL(/\/dashboard\/status/);
  });

  test('should NOT trigger shortcuts when typing in input field', async ({ page }) => {
    // Create a test input field
    await page.evaluate(() => {
      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'test-input';
      document.body.appendChild(input);
    });

    // Focus the input
    await page.locator('#test-input').focus();

    // Type ㅅ in the input
    await page.keyboard.press('ㅅ');

    // Should NOT navigate to status page
    await expect(page).not.toHaveURL(/\/dashboard\/status/);

    // Input should contain the character
    const value = await page.locator('#test-input').inputValue();
    expect(value).toBe('ㅅ');
  });

  test('should NOT trigger shortcuts with modifier keys', async ({ page }) => {
    // Press Ctrl+ㅅ (should not trigger status)
    await page.keyboard.press('Control+ㅅ');

    // Should NOT navigate to status page
    await expect(page).not.toHaveURL(/\/dashboard\/status/);

    // Press Alt+ㄱ (should not trigger next task)
    await page.keyboard.press('Alt+ㄱ');

    // Should not show any toast (no task queued)
    await expect(page.getByText(/Task queued/i)).not.toBeVisible();
  });

  test('should show sequence indicator for ㄱㄱㄱ', async ({ page }) => {
    // Press ㄱ first time
    await page.keyboard.press('ㄱ');
    await page.waitForTimeout(200);

    // Press ㄱ second time
    await page.keyboard.press('ㄱ');

    // Should show sequence indicator (2/5 or similar)
    await expect(page.getByText(/sequence/i)).toBeVisible({ timeout: 2000 });
  });

  test('should reset sequence after timeout (800ms)', async ({ page }) => {
    // Press ㄱ
    await page.keyboard.press('ㄱ');

    // Wait longer than sequence timeout (800ms)
    await page.waitForTimeout(1000);

    // Press ㄱ again
    await page.keyboard.press('ㄱ');

    // Should treat as single task, not sequence
    await expect(page.getByText(/Task queued/i)).toBeVisible();
    // Should NOT show sequence indicator or "2 tasks"
    await expect(page.getByText(/2.*tasks/i)).not.toBeVisible();
  });

  test('should display all shortcuts in help modal', async ({ page }) => {
    await page.keyboard.press('Shift+?');

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // All 8 Korean shortcuts should be listed
    const shortcuts = ['ㅅ', 'ㅎ', 'ㅂ', 'ㄱ', 'ㅋ', 'ㅊ', 'ㅌ', 'ㅍ'];

    for (const shortcut of shortcuts) {
      await expect(page.getByText(shortcut)).toBeVisible();
    }

    // All English fallbacks should be listed
    const englishShortcuts = ['S', 'H', 'B', 'G', 'K', 'C', 'T', 'P'];

    // Switch to English tab
    await page.getByRole('tab', { name: /English/i }).click();

    for (const shortcut of englishShortcuts) {
      await expect(page.getByText(shortcut)).toBeVisible();
    }
  });
});

test.describe('Korean Shortcuts - Command Execution', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should execute ㅋ (Commit & Push) command', async ({ page }) => {
    await page.route('**/api/claude/commands', async (route) => {
      if (route.request().method() === 'POST') {
        const body = await route.request().postDataJSON();
        if (body.command === 'commit_push') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              taskId: 'task-commit-123',
              message: 'Commit and push initiated',
              data: {
                branch: 'claude/test-branch',
                committed: true,
                pushed: true,
              },
            }),
          });
        }
      } else {
        await route.continue();
      }
    });

    await page.keyboard.press('ㅋ');

    await expect(page.getByText(/Commit.*push/i)).toBeVisible({ timeout: 5000 });
  });

  test('should execute ㅊ (Code Review) command', async ({ page }) => {
    await page.route('**/api/claude/commands', async (route) => {
      if (route.request().method() === 'POST') {
        const body = await route.request().postDataJSON();
        if (body.command === 'code_review') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              taskId: 'task-review-123',
              message: 'Code review started',
              data: {
                lintErrors: 0,
                suggestions: 3,
              },
            }),
          });
        }
      } else {
        await route.continue();
      }
    });

    await page.keyboard.press('ㅊ');

    await expect(page.getByText(/Code review/i)).toBeVisible({ timeout: 5000 });
  });

  test('should execute ㅌ (Test) command', async ({ page }) => {
    await page.route('**/api/claude/commands', async (route) => {
      if (route.request().method() === 'POST') {
        const body = await route.request().postDataJSON();
        if (body.command === 'test') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              taskId: 'task-test-123',
              message: 'Tests started',
              data: {
                totalTests: 40,
                passed: 40,
                failed: 0,
              },
            }),
          });
        }
      } else {
        await route.continue();
      }
    });

    await page.keyboard.press('ㅌ');

    await expect(page.getByText(/Tests/i)).toBeVisible({ timeout: 5000 });
  });

  test('should execute ㅍ (Deploy) command', async ({ page }) => {
    await page.route('**/api/claude/commands', async (route) => {
      if (route.request().method() === 'POST') {
        const body = await route.request().postDataJSON();
        if (body.command === 'deploy') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              taskId: 'task-deploy-123',
              message: 'Deployment started',
              data: {
                deploymentId: 'deploy-abc123',
                environment: 'production',
              },
            }),
          });
        }
      } else {
        await route.continue();
      }
    });

    await page.keyboard.press('ㅍ');

    await expect(page.getByText(/Deploy/i)).toBeVisible({ timeout: 5000 });
  });
});
