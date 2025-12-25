/**
 * E2E Tests for BIDFLOW Dashboard
 * Tests the main dashboard functionality including:
 * - Real-time statistics display
 * - Bid list with filters
 * - Upcoming deadlines with D-Day countdown
 * - AI analysis modal
 * - Notification system
 * - Demo mode toggle
 */

import { test, expect } from '@playwright/test';

test.describe('BIDFLOW Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should display dashboard title and navigation', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();

    // Check for main navigation items
    await expect(page.getByRole('link', { name: /Dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Bids/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Campaigns/i })).toBeVisible();
  });

  test('should toggle demo mode', async ({ page }) => {
    // Find demo mode toggle
    const demoToggle = page.locator('input[type="checkbox"]').first();

    // Should start in demo mode
    await expect(demoToggle).toBeChecked();

    // Toggle off
    await demoToggle.click();
    await expect(demoToggle).not.toBeChecked();

    // Toggle back on
    await demoToggle.click();
    await expect(demoToggle).toBeChecked();
  });
});

test.describe('Dashboard Statistics', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API endpoints
    await page.route('**/api/v1/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            totalBids: 156,
            activeBids: 42,
            wonBids: 28,
            totalValue: 12500000,
            winRate: 0.67,
            avgBidValue: 450000,
          },
        }),
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should display all statistics cards', async ({ page }) => {
    // Total Bids
    await expect(page.getByText('Total Bids')).toBeVisible();
    await expect(page.getByText('156')).toBeVisible();

    // Active Bids
    await expect(page.getByText('Active Bids')).toBeVisible();
    await expect(page.getByText('42')).toBeVisible();

    // Won Bids
    await expect(page.getByText('Won Bids')).toBeVisible();
    await expect(page.getByText('28')).toBeVisible();

    // Total Value
    await expect(page.getByText('Total Value')).toBeVisible();
    await expect(page.getByText(/12\.5M/)).toBeVisible();
  });

  test('should format large numbers correctly', async ({ page }) => {
    // Check for proper number formatting (K, M, B)
    const totalValue = page.getByText(/12\.5M/);
    await expect(totalValue).toBeVisible();
  });

  test('should show loading state before data loads', async ({ page }) => {
    // Delay API response to see loading state
    await page.route('**/api/v1/stats', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            totalBids: 156,
            activeBids: 42,
            wonBids: 28,
            totalValue: 12500000,
          },
        }),
      });
    });

    await page.goto('/dashboard');

    // Check for loading spinner or skeleton
    const spinner = page.locator('.animate-pulse, .animate-spin');
    await expect(spinner.first()).toBeVisible();
  });

  test('should handle API error gracefully', async ({ page }) => {
    await page.route('**/api/v1/stats', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal server error',
        }),
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should show fallback or demo data
    await expect(page.getByText(/Total Bids/)).toBeVisible();
  });
});

test.describe('Bid List', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/bids*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            bids: [
              {
                id: 'bid-1',
                title: 'Smart City Infrastructure Project',
                organization: 'Seoul Metropolitan Government',
                budget: 5000000,
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'active',
                winProbability: 0.75,
              },
              {
                id: 'bid-2',
                title: 'Digital Transformation Initiative',
                organization: 'Ministry of Industry',
                budget: 3200000,
                deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'active',
                winProbability: 0.62,
              },
            ],
            total: 2,
          },
        }),
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should display bid cards', async ({ page }) => {
    await expect(page.getByText('Smart City Infrastructure Project')).toBeVisible();
    await expect(page.getByText('Digital Transformation Initiative')).toBeVisible();
  });

  test('should show bid details', async ({ page }) => {
    const firstBid = page.locator('.bid-card, [data-testid="bid-card"]').first();

    // Organization
    await expect(firstBid.getByText('Seoul Metropolitan Government')).toBeVisible();

    // Budget
    await expect(firstBid.getByText(/5\.0M/)).toBeVisible();

    // Win probability
    await expect(firstBid.getByText(/75%/)).toBeVisible();
  });

  test('should filter bids by status', async ({ page }) => {
    // Click on status filter
    const statusFilter = page.getByRole('button', { name: /Status/i });
    await statusFilter.click();

    // Select 'Active' status
    await page.getByRole('option', { name: /Active/i }).click();

    // Verify filtered results
    await expect(page.getByText('Smart City Infrastructure Project')).toBeVisible();
  });

  test('should sort bids', async ({ page }) => {
    // Click on sort dropdown
    const sortButton = page.getByRole('button', { name: /Sort/i });
    await sortButton.click();

    // Select 'Budget' sort
    await page.getByRole('option', { name: /Budget/i }).click();

    // Wait for re-render
    await page.waitForTimeout(500);

    // Verify order (highest budget first if descending)
    const bids = page.locator('.bid-card, [data-testid="bid-card"]');
    const firstBidTitle = await bids.first().getByRole('heading').textContent();
    expect(firstBidTitle).toContain('Smart City');
  });

  test('should navigate to bid details on click', async ({ page }) => {
    const firstBid = page.locator('.bid-card, [data-testid="bid-card"]').first();
    await firstBid.click();

    // Should navigate to bid detail page
    await expect(page).toHaveURL(/\/bids\/bid-1/);
  });
});

test.describe('Upcoming Deadlines', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/bids/upcoming', async (route) => {
      const now = new Date();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'urgent-1',
              title: 'Urgent Infrastructure Bid',
              deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
              budget: 2000000,
            },
            {
              id: 'urgent-2',
              title: 'Technology Procurement',
              deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days
              budget: 1500000,
            },
          ],
        }),
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should display upcoming deadlines section', async ({ page }) => {
    await expect(page.getByText(/Upcoming Deadlines/i)).toBeVisible();
  });

  test('should show D-Day countdown', async ({ page }) => {
    // Check for D-Day indicators
    await expect(page.getByText(/D-2/)).toBeVisible(); // 2 days left
    await expect(page.getByText(/D-5/)).toBeVisible(); // 5 days left
  });

  test('should highlight urgent deadlines (< 3 days)', async ({ page }) => {
    const urgentBid = page.locator('[data-testid="deadline-card"]').first();

    // Should have urgent styling (red border/background)
    const hasUrgentClass = await urgentBid.evaluate((el) => {
      return el.className.includes('red') || el.className.includes('urgent');
    });
    expect(hasUrgentClass).toBeTruthy();
  });

  test('should display deadline cards in horizontal scroll', async ({ page }) => {
    const deadlineSection = page.locator('[data-testid="deadlines-scroll"]');

    // Should have overflow-x-auto or similar
    const hasScroll = await deadlineSection.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.overflowX === 'auto' || styles.overflowX === 'scroll';
    });
    expect(hasScroll).toBeTruthy();
  });
});

test.describe('AI Analysis Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/bids*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            bids: [
              {
                id: 'bid-1',
                title: 'Smart City Project',
                organization: 'Seoul Government',
                budget: 5000000,
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'active',
              },
            ],
            total: 1,
          },
        }),
      });
    });

    await page.route('**/api/v1/bids/bid-1/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            winProbability: 0.78,
            riskFactors: [
              'High competition from established vendors',
              'Tight deadline requires additional resources',
            ],
            strengths: [
              'Strong technical expertise match',
              'Competitive pricing strategy',
              'Previous successful projects with similar scope',
            ],
            recommendations: [
              'Highlight past smart city implementations',
              'Emphasize local partnership advantages',
              'Consider adding buffer time in project timeline',
            ],
          },
        }),
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should open AI analysis modal on button click', async ({ page }) => {
    const analyzeButton = page.getByRole('button', { name: /AI Analysis/i }).first();
    await analyzeButton.click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(page.getByText(/AI Analysis/i)).toBeVisible();
  });

  test('should display win probability', async ({ page }) => {
    const analyzeButton = page.getByRole('button', { name: /AI Analysis/i }).first();
    await analyzeButton.click();

    await expect(page.getByText(/Win Probability/i)).toBeVisible();
    await expect(page.getByText('78%')).toBeVisible();
  });

  test('should show risk factors', async ({ page }) => {
    const analyzeButton = page.getByRole('button', { name: /AI Analysis/i }).first();
    await analyzeButton.click();

    await expect(page.getByText(/Risk Factors/i)).toBeVisible();
    await expect(page.getByText(/High competition from established vendors/)).toBeVisible();
    await expect(page.getByText(/Tight deadline requires additional resources/)).toBeVisible();
  });

  test('should show strengths', async ({ page }) => {
    const analyzeButton = page.getByRole('button', { name: /AI Analysis/i }).first();
    await analyzeButton.click();

    await expect(page.getByText(/Strengths/i)).toBeVisible();
    await expect(page.getByText(/Strong technical expertise match/)).toBeVisible();
  });

  test('should show recommendations', async ({ page }) => {
    const analyzeButton = page.getByRole('button', { name: /AI Analysis/i }).first();
    await analyzeButton.click();

    await expect(page.getByText(/Recommendations/i)).toBeVisible();
    await expect(page.getByText(/Highlight past smart city implementations/)).toBeVisible();
  });

  test('should close modal on close button click', async ({ page }) => {
    const analyzeButton = page.getByRole('button', { name: /AI Analysis/i }).first();
    await analyzeButton.click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    const closeButton = page.getByRole('button', { name: /Close/i });
    await closeButton.click();

    await expect(modal).not.toBeVisible();
  });

  test('should close modal on Escape key', async ({ page }) => {
    const analyzeButton = page.getByRole('button', { name: /AI Analysis/i }).first();
    await analyzeButton.click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('should show loading state while analyzing', async ({ page }) => {
    await page.route('**/api/v1/bids/bid-1/analyze', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            winProbability: 0.78,
            riskFactors: [],
            strengths: [],
            recommendations: [],
          },
        }),
      });
    });

    const analyzeButton = page.getByRole('button', { name: /AI Analysis/i }).first();
    await analyzeButton.click();

    // Should show loading spinner
    const spinner = page.locator('.animate-spin');
    await expect(spinner).toBeVisible();
  });
});

test.describe('Notification System', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/notifications*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'notif-1',
                title: 'New bid opportunity',
                message: 'Smart City Infrastructure Project is now available',
                type: 'bid_update',
                read: false,
                createdAt: new Date().toISOString(),
              },
              {
                id: 'notif-2',
                title: 'Deadline approaching',
                message: 'Digital Transformation Initiative deadline in 3 days',
                type: 'deadline',
                read: false,
                createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
              },
              {
                id: 'notif-3',
                title: 'Bid won',
                message: 'Congratulations! You won the Government IT Project',
                type: 'status_change',
                read: true,
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              },
            ],
            unreadCount: 2,
          }),
        });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Notification marked as read',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should display notification bell icon', async ({ page }) => {
    const bellIcon = page.locator('[data-testid="notification-bell"]');
    await expect(bellIcon).toBeVisible();
  });

  test('should show unread count badge', async ({ page }) => {
    const badge = page.locator('[data-testid="unread-badge"]');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText('2');
  });

  test('should open notifications panel on bell click', async ({ page }) => {
    const bellIcon = page.locator('[data-testid="notification-bell"]');
    await bellIcon.click();

    const panel = page.locator('[data-testid="notifications-panel"]');
    await expect(panel).toBeVisible();
  });

  test('should display all notifications', async ({ page }) => {
    const bellIcon = page.locator('[data-testid="notification-bell"]');
    await bellIcon.click();

    await expect(page.getByText('New bid opportunity')).toBeVisible();
    await expect(page.getByText('Deadline approaching')).toBeVisible();
    await expect(page.getByText('Bid won')).toBeVisible();
  });

  test('should differentiate unread notifications', async ({ page }) => {
    const bellIcon = page.locator('[data-testid="notification-bell"]');
    await bellIcon.click();

    const firstNotif = page.locator('[data-testid="notification-item"]').first();

    // Unread should have different background
    const hasUnreadStyle = await firstNotif.evaluate((el) => {
      return el.className.includes('unread') || el.className.includes('bg-blue');
    });
    expect(hasUnreadStyle).toBeTruthy();
  });

  test('should mark notification as read on click', async ({ page }) => {
    const bellIcon = page.locator('[data-testid="notification-bell"]');
    await bellIcon.click();

    const firstNotif = page.locator('[data-testid="notification-item"]').first();
    await firstNotif.click();

    // Badge count should decrease
    await page.waitForTimeout(500);
    const badge = page.locator('[data-testid="unread-badge"]');
    await expect(badge).toHaveText('1');
  });

  test('should show "no notifications" message when empty', async ({ page }) => {
    await page.route('**/api/v1/notifications*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          unreadCount: 0,
        }),
      });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    const bellIcon = page.locator('[data-testid="notification-bell"]');
    await bellIcon.click();

    await expect(page.getByText(/No notifications/i)).toBeVisible();
  });

  test('should close panel on outside click', async ({ page }) => {
    const bellIcon = page.locator('[data-testid="notification-bell"]');
    await bellIcon.click();

    const panel = page.locator('[data-testid="notifications-panel"]');
    await expect(panel).toBeVisible();

    // Click outside
    await page.mouse.click(100, 100);

    await expect(panel).not.toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Content should still be visible
    await expect(page.getByText(/Dashboard/i)).toBeVisible();
    await expect(page.getByText(/Total Bids/i)).toBeVisible();
  });

  test('should stack cards vertically on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const statsCards = page.locator('[data-testid="stat-card"]');
    const count = await statsCards.count();
    expect(count).toBeGreaterThan(0);

    // Cards should stack (check if grid has 1 column on mobile)
    const grid = page.locator('.grid');
    const hasOneColumn = await grid.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.gridTemplateColumns.includes('1fr');
    });
    expect(hasOneColumn).toBeTruthy();
  });

  test('should show mobile navigation menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for hamburger menu
    const menuButton = page.locator('[data-testid="mobile-menu-button"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();

      // Navigation items should be visible
      await expect(page.getByRole('link', { name: /Dashboard/i })).toBeVisible();
    }
  });
});
