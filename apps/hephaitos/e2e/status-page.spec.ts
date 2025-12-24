/**
 * E2E Tests for Status Page
 * Tests the /dashboard/status page functionality including:
 * - Status display
 * - Progress metrics
 * - Keyboard shortcuts reference
 * - Refresh functionality
 * - Real-time updates
 */

import { test, expect } from '@playwright/test';

test.describe('Status Page', () => {
  test.beforeEach(async ({ page }) => {
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
            currentTask: 'E2E Testing - Korean shortcuts & mobile integration',
            currentTaskProgress: 85,
            nextTask: 'WebSocket server deployment',
            nextTaskPriority: 'High',
            stats: {
              todayCommits: 9,
              tasksCompleted: 15,
              tasksRemaining: 2,
              uptime: 7200, // 2 hours
            },
            shortcuts: [
              { key: 'ㅅ (S)', description: 'Status check' },
              { key: 'ㅎ (H)', description: 'HEPHAITOS mode' },
              { key: 'ㅂ (B)', description: 'BIDFLOW mode' },
              { key: 'ㄱ (G)', description: 'Next task' },
              { key: 'ㅋ (K)', description: 'Commit & push' },
              { key: 'ㅊ (C)', description: 'Code review' },
              { key: 'ㅌ (T)', description: 'Test' },
              { key: 'ㅍ (P)', description: 'Deploy' },
            ],
          },
        }),
      });
    });

    await page.goto('/dashboard/status');
    await page.waitForLoadState('networkidle');
  });

  test('should display page title and description', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /System Status/i })).toBeVisible();
    await expect(page.getByText(/Real-time project status and metrics/i)).toBeVisible();
  });

  test('should display project name and completion', async ({ page }) => {
    await expect(page.getByText('HEPHAITOS')).toBeVisible();
    await expect(page.getByText('98%')).toBeVisible();
  });

  test('should show connected indicator', async ({ page }) => {
    // Check for the green pulse indicator
    const connectedIndicator = page.locator('.bg-green-500.animate-pulse');
    await expect(connectedIndicator).toBeVisible();

    await expect(page.getByText('Connected')).toBeVisible();
  });

  test('should display overall progress bar', async ({ page }) => {
    // Check progress bar exists
    const progressBar = page.locator('.bg-gradient-to-r.from-blue-500.to-purple-500');
    await expect(progressBar).toBeVisible();

    // Check progress bar width matches completion percentage
    const width = await progressBar.evaluate((el) => el.style.width);
    expect(width).toBe('98%');
  });

  test('should display current task information', async ({ page }) => {
    await expect(page.getByText('Current Task')).toBeVisible();
    await expect(
      page.getByText('E2E Testing - Korean shortcuts & mobile integration')
    ).toBeVisible();

    // Check current task progress bar
    const taskProgressBar = page.locator('.bg-blue-500').first();
    await expect(taskProgressBar).toBeVisible();
  });

  test('should display next task with priority', async ({ page }) => {
    await expect(page.getByText('Next Task')).toBeVisible();
    await expect(page.getByText('WebSocket server deployment')).toBeVisible();
    await expect(page.getByText('High')).toBeVisible();

    // Check priority badge styling
    const priorityBadge = page.locator('.bg-orange-500\\/20.text-orange-400');
    await expect(priorityBadge).toBeVisible();
  });

  test('should display all statistics', async ({ page }) => {
    // Today's Commits
    await expect(page.getByText("Today's Commits")).toBeVisible();
    await expect(page.getByText('9').first()).toBeVisible();

    // Tasks Completed
    await expect(page.getByText('Tasks Completed')).toBeVisible();
    await expect(page.getByText('15')).toBeVisible();

    // Tasks Remaining
    await expect(page.getByText('Tasks Remaining')).toBeVisible();
    await expect(page.getByText('2').first()).toBeVisible();

    // Uptime
    await expect(page.getByText('Uptime')).toBeVisible();
    await expect(page.getByText('2h 0m')).toBeVisible();
  });

  test('should display keyboard shortcuts reference', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Keyboard Shortcuts/i })).toBeVisible();

    // All 8 shortcuts should be visible
    const shortcuts = [
      { key: 'ㅅ', description: 'Status' },
      { key: 'ㅎ', description: 'HEPHAITOS' },
      { key: 'ㅂ', description: 'BIDFLOW' },
      { key: 'ㄱ', description: 'Next' },
      { key: 'ㅋ', description: 'Commit' },
      { key: 'ㅊ', description: 'Code review' },
      { key: 'ㅌ', description: 'Test' },
      { key: 'ㅍ', description: 'Deploy' },
    ];

    for (const shortcut of shortcuts) {
      await expect(page.getByText(shortcut.key)).toBeVisible();
    }
  });

  test('should have refresh button', async ({ page }) => {
    const refreshButton = page.getByRole('button', { name: /Refresh Status/i });
    await expect(refreshButton).toBeVisible();

    // Check for refresh icon
    const refreshIcon = refreshButton.locator('svg');
    await expect(refreshIcon).toBeVisible();
  });

  test('should refresh status on button click', async ({ page }) => {
    let apiCallCount = 0;

    // Count API calls
    await page.route('**/api/mobile/status*', async (route) => {
      apiCallCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            project: 'HEPHAITOS',
            completion: 99, // Changed value
            currentTask: 'Updated task',
            currentTaskProgress: 90,
            nextTask: 'Next task',
            nextTaskPriority: 'Medium',
            stats: {
              todayCommits: 10, // Changed value
              tasksCompleted: 16,
              tasksRemaining: 1,
              uptime: 7300,
            },
          },
        }),
      });
    });

    // Initial load
    await page.goto('/dashboard/status');
    await page.waitForLoadState('networkidle');

    const initialCalls = apiCallCount;

    // Click refresh button
    const refreshButton = page.getByRole('button', { name: /Refresh Status/i });
    await refreshButton.click();

    // Wait for API call
    await page.waitForTimeout(500);

    // API should be called again
    expect(apiCallCount).toBeGreaterThan(initialCalls);

    // Check updated values
    await expect(page.getByText('99%')).toBeVisible();
    await expect(page.getByText('10').first()).toBeVisible();
  });

  test('should show loading state', async ({ page }) => {
    // Delay the API response to see loading state
    await page.route('**/api/mobile/status*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
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
              uptime: 7200,
            },
          },
        }),
      });
    });

    await page.goto('/dashboard/status');

    // Check for loading spinner
    const spinner = page.locator('.animate-spin');
    await expect(spinner).toBeVisible();

    // Wait for content to load
    await page.waitForLoadState('networkidle');
    await expect(spinner).not.toBeVisible();
  });

  test('should show error state when API fails', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/mobile/status*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal server error',
        }),
      });
    });

    await page.goto('/dashboard/status');
    await page.waitForLoadState('networkidle');

    // Check error message
    await expect(page.getByText(/Error Loading Status/i)).toBeVisible();
    await expect(page.getByText(/Failed to fetch status/i)).toBeVisible();

    // Check retry button
    const retryButton = page.getByRole('button', { name: /Retry/i });
    await expect(retryButton).toBeVisible();
  });

  test('should retry on error', async ({ page }) => {
    let apiCallCount = 0;

    await page.route('**/api/mobile/status*', async (route) => {
      apiCallCount++;

      if (apiCallCount === 1) {
        // First call fails
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ success: false, error: 'Server error' }),
        });
      } else {
        // Second call succeeds
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              project: 'HEPHAITOS',
              completion: 98,
              currentTask: 'Testing',
              currentTaskProgress: 80,
              nextTask: 'Next',
              nextTaskPriority: 'High',
              stats: {
                todayCommits: 9,
                tasksCompleted: 15,
                tasksRemaining: 2,
                uptime: 7200,
              },
            },
          }),
        });
      }
    });

    await page.goto('/dashboard/status');
    await page.waitForLoadState('networkidle');

    // Should show error first
    await expect(page.getByText(/Error Loading Status/i)).toBeVisible();

    // Click retry
    const retryButton = page.getByRole('button', { name: /Retry/i });
    await retryButton.click();

    // Should load successfully
    await expect(page.getByText('System Status')).toBeVisible();
    await expect(page.getByText('98%')).toBeVisible();
  });

  test('should format uptime correctly', async ({ page }) => {
    // Test different uptime formats
    const testCases = [
      { seconds: 1800, expected: '30m' }, // 30 minutes
      { seconds: 3600, expected: '1h 0m' }, // 1 hour
      { seconds: 5400, expected: '1h 30m' }, // 1.5 hours
      { seconds: 7200, expected: '2h 0m' }, // 2 hours
    ];

    for (const testCase of testCases) {
      await page.route('**/api/mobile/status*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              project: 'HEPHAITOS',
              completion: 98,
              currentTask: 'Test',
              currentTaskProgress: 80,
              nextTask: 'Next',
              nextTaskPriority: 'High',
              stats: {
                todayCommits: 9,
                tasksCompleted: 15,
                tasksRemaining: 2,
                uptime: testCase.seconds,
              },
            },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      await expect(page.getByText(testCase.expected)).toBeVisible();
    }
  });

  test('should have responsive grid layout', async ({ page }) => {
    // Check for grid layout classes
    const statsGrid = page.locator('.grid.grid-cols-2.md\\:grid-cols-4');
    await expect(statsGrid).toBeVisible();

    const shortcutsGrid = page.locator('.grid.grid-cols-1.md\\:grid-cols-2');
    await expect(shortcutsGrid).toBeVisible();
  });

  test('should handle mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/dashboard/status');
    await page.waitForLoadState('networkidle');

    // Content should still be visible and accessible
    await expect(page.getByText('System Status')).toBeVisible();
    await expect(page.getByText('HEPHAITOS')).toBeVisible();
    await expect(page.getByText('98%')).toBeVisible();

    // Stats should stack vertically on mobile
    const statsCards = page.locator('.grid.grid-cols-2');
    await expect(statsCards).toBeVisible();
  });

  test('should navigate via ㅅ shortcut', async ({ page }) => {
    // Start from dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Press ㅅ
    await page.keyboard.press('ㅅ');

    // Should navigate to status page
    await expect(page).toHaveURL(/\/dashboard\/status/);
    await expect(page.getByText('System Status')).toBeVisible();
  });
});

test.describe('Status Page - Different Projects', () => {
  test('should display HEPHAITOS status', async ({ page }) => {
    await page.route('**/api/mobile/status*', async (route) => {
      const url = new URL(route.request().url());
      const project = url.searchParams.get('project');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            project: project || 'HEPHAITOS',
            completion: 98,
            currentTask: 'HEPHAITOS task',
            currentTaskProgress: 80,
            nextTask: 'Next HEPHAITOS task',
            nextTaskPriority: 'High',
            stats: {
              todayCommits: 9,
              tasksCompleted: 15,
              tasksRemaining: 2,
              uptime: 7200,
            },
          },
        }),
      });
    });

    await page.goto('/dashboard/status?project=HEPHAITOS');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('HEPHAITOS')).toBeVisible();
    await expect(page.getByText('98%')).toBeVisible();
  });

  test('should display BIDFLOW status', async ({ page }) => {
    await page.route('**/api/mobile/status*', async (route) => {
      const url = new URL(route.request().url());
      const project = url.searchParams.get('project');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            project: project || 'BIDFLOW',
            completion: 100,
            currentTask: 'BIDFLOW task',
            currentTaskProgress: 100,
            nextTask: 'Next BIDFLOW task',
            nextTaskPriority: 'Medium',
            stats: {
              todayCommits: 4,
              tasksCompleted: 10,
              tasksRemaining: 0,
              uptime: 3600,
            },
          },
        }),
      });
    });

    await page.goto('/dashboard/status?project=BIDFLOW');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('BIDFLOW')).toBeVisible();
    await expect(page.getByText('100%')).toBeVisible();
  });
});
