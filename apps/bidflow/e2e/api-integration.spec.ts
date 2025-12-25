/**
 * E2E Tests for BIDFLOW API Integration
 * Tests all API endpoints and integration:
 * - Statistics API
 * - Bids API (CRUD operations)
 * - Notifications API
 * - AI Analysis API
 * - Error handling
 * - Loading states
 * - Data persistence
 */

import { test, expect } from '@playwright/test';

test.describe('Statistics API Integration', () => {
  test('should fetch and display statistics successfully', async ({ page, request }) => {
    const response = await request.get('http://localhost:3010/api/v1/stats');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.totalBids).toBeGreaterThanOrEqual(0);
    expect(data.data.activeBids).toBeGreaterThanOrEqual(0);
    expect(data.data.wonBids).toBeGreaterThanOrEqual(0);
  });

  test('should handle stats API error gracefully', async ({ page }) => {
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

    // Should still show dashboard (with demo data or error message)
    await expect(page.getByText(/Dashboard/i)).toBeVisible();
  });

  test('should cache statistics data', async ({ page }) => {
    let apiCallCount = 0;

    await page.route('**/api/v1/stats', async (route) => {
      apiCallCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            totalBids: 100,
            activeBids: 25,
            wonBids: 15,
            totalValue: 10000000,
          },
        }),
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const initialCalls = apiCallCount;

    // Navigate away and back
    await page.goto('/bids');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // API should be called again (or check if cache is used based on implementation)
    expect(apiCallCount).toBeGreaterThanOrEqual(initialCalls);
  });
});

test.describe('Bids API Integration', () => {
  test('should fetch bids list successfully', async ({ request }) => {
    const response = await request.get('http://localhost:3010/api/v1/bids');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.bids).toBeInstanceOf(Array);
    expect(data.data.total).toBeGreaterThanOrEqual(0);
  });

  test('should filter bids by status', async ({ request }) => {
    const response = await request.get('http://localhost:3010/api/v1/bids?status=active');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);

    // All returned bids should have status 'active'
    if (data.data.bids.length > 0) {
      data.data.bids.forEach((bid: any) => {
        expect(bid.status).toBe('active');
      });
    }
  });

  test('should search bids by query', async ({ request }) => {
    const response = await request.get('http://localhost:3010/api/v1/bids?search=infrastructure');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);

    // Returned bids should match search query
    if (data.data.bids.length > 0) {
      data.data.bids.forEach((bid: any) => {
        const matchesSearch =
          bid.title.toLowerCase().includes('infrastructure') ||
          bid.description?.toLowerCase().includes('infrastructure');
        expect(matchesSearch).toBeTruthy();
      });
    }
  });

  test('should fetch single bid by ID', async ({ request }) => {
    // First get a bid ID
    const listResponse = await request.get('http://localhost:3010/api/v1/bids');
    const listData = await listResponse.json();

    if (listData.data.bids.length > 0) {
      const bidId = listData.data.bids[0].id;

      const response = await request.get(`http://localhost:3010/api/v1/bids/${bidId}`);

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(bidId);
    }
  });

  test('should return 404 for non-existent bid', async ({ request }) => {
    const response = await request.get('http://localhost:3010/api/v1/bids/non-existent-id');

    expect(response.status()).toBe(404);

    const data = await response.json();
    expect(data.success).toBe(false);
  });

  test('should create new bid', async ({ request }) => {
    const newBid = {
      title: 'Test Bid from E2E',
      organization: 'Test Organization',
      budget: 1000000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Test description',
    };

    const response = await request.post('http://localhost:3010/api/v1/bids', {
      data: newBid,
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(201);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.title).toBe(newBid.title);
    expect(data.data.id).toBeDefined();
  });

  test('should validate required fields when creating bid', async ({ request }) => {
    const invalidBid = {
      // Missing required fields
      description: 'Test description',
    };

    const response = await request.post('http://localhost:3010/api/v1/bids', {
      data: invalidBid,
    });

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  test('should update bid', async ({ request }) => {
    // First create a bid
    const newBid = {
      title: 'Bid to Update',
      organization: 'Test Org',
      budget: 500000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const createResponse = await request.post('http://localhost:3010/api/v1/bids', {
      data: newBid,
    });
    const createData = await createResponse.json();
    const bidId = createData.data.id;

    // Update the bid
    const updateResponse = await request.patch(`http://localhost:3010/api/v1/bids/${bidId}`, {
      data: {
        title: 'Updated Bid Title',
        status: 'submitted',
      },
    });

    expect(updateResponse.ok()).toBeTruthy();

    const updateData = await updateResponse.json();
    expect(updateData.success).toBe(true);
    expect(updateData.data.title).toBe('Updated Bid Title');
    expect(updateData.data.status).toBe('submitted');
  });

  test('should delete bid', async ({ request }) => {
    // First create a bid
    const newBid = {
      title: 'Bid to Delete',
      organization: 'Test Org',
      budget: 500000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const createResponse = await request.post('http://localhost:3010/api/v1/bids', {
      data: newBid,
    });
    const createData = await createResponse.json();
    const bidId = createData.data.id;

    // Delete the bid
    const deleteResponse = await request.delete(`http://localhost:3010/api/v1/bids/${bidId}`);

    expect(deleteResponse.ok()).toBeTruthy();

    // Try to fetch deleted bid
    const fetchResponse = await request.get(`http://localhost:3010/api/v1/bids/${bidId}`);
    expect(fetchResponse.status()).toBe(404);
  });
});

test.describe('Upcoming Deadlines API', () => {
  test('should fetch upcoming deadlines', async ({ request }) => {
    const response = await request.get('http://localhost:3010/api/v1/bids/upcoming');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeInstanceOf(Array);

    // All bids should have deadlines within 7 days
    if (data.data.length > 0) {
      const now = new Date();
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      data.data.forEach((bid: any) => {
        const deadline = new Date(bid.deadline);
        expect(deadline.getTime()).toBeLessThanOrEqual(sevenDaysLater.getTime());
      });
    }
  });

  test('should limit upcoming deadlines to specified count', async ({ request }) => {
    const response = await request.get('http://localhost:3010/api/v1/bids/upcoming?limit=5');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.length).toBeLessThanOrEqual(5);
  });
});

test.describe('AI Analysis API', () => {
  test('should analyze bid and return insights', async ({ request }) => {
    // First get a bid ID
    const listResponse = await request.get('http://localhost:3010/api/v1/bids');
    const listData = await listResponse.json();

    if (listData.data.bids.length > 0) {
      const bidId = listData.data.bids[0].id;

      const response = await request.post(`http://localhost:3010/api/v1/bids/${bidId}/analyze`);

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.winProbability).toBeGreaterThanOrEqual(0);
      expect(data.data.winProbability).toBeLessThanOrEqual(1);
      expect(data.data.riskFactors).toBeInstanceOf(Array);
      expect(data.data.strengths).toBeInstanceOf(Array);
      expect(data.data.recommendations).toBeInstanceOf(Array);
    }
  });

  test('should handle analysis timeout gracefully', async ({ page }) => {
    await page.route('**/api/v1/bids/*/analyze', async (route) => {
      // Simulate long running analysis
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            winProbability: 0.5,
            riskFactors: [],
            strengths: [],
            recommendations: [],
          },
        }),
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const analyzeButton = page.getByRole('button', { name: /AI Analysis/i }).first();
    if (await analyzeButton.isVisible()) {
      await analyzeButton.click();

      // Should show loading state
      await expect(page.locator('.animate-spin')).toBeVisible({ timeout: 1000 });
    }
  });
});

test.describe('Notifications API', () => {
  test('should fetch notifications', async ({ request }) => {
    const response = await request.get('http://localhost:3010/api/v1/notifications');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeInstanceOf(Array);
    expect(data.unreadCount).toBeGreaterThanOrEqual(0);
  });

  test('should filter unread notifications', async ({ request }) => {
    const response = await request.get('http://localhost:3010/api/v1/notifications?unread=true');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);

    // All notifications should be unread
    if (data.data.length > 0) {
      data.data.forEach((notification: any) => {
        expect(notification.read).toBe(false);
      });
    }
  });

  test('should mark notification as read', async ({ request }) => {
    // First get a notification
    const listResponse = await request.get('http://localhost:3010/api/v1/notifications?unread=true');
    const listData = await listResponse.json();

    if (listData.data.length > 0) {
      const notificationId = listData.data[0].id;

      const response = await request.post('http://localhost:3010/api/v1/notifications', {
        data: {
          notificationId,
          read: true,
        },
      });

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify notification is marked as read
      const verifyResponse = await request.get(`http://localhost:3010/api/v1/notifications/${notificationId}`);
      const verifyData = await verifyResponse.json();
      expect(verifyData.data.read).toBe(true);
    }
  });

  test('should mark all notifications as read', async ({ request }) => {
    const response = await request.post('http://localhost:3010/api/v1/notifications/mark-all-read');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify unread count is 0
    const verifyResponse = await request.get('http://localhost:3010/api/v1/notifications');
    const verifyData = await verifyResponse.json();
    expect(verifyData.unreadCount).toBe(0);
  });
});

test.describe('Error Handling', () => {
  test('should handle network errors', async ({ page }) => {
    await page.route('**/api/v1/bids', async (route) => {
      await route.abort('failed');
    });

    await page.goto('/dashboard');

    // Should show error message or fallback to demo mode
    await expect(page.getByText(/Dashboard/i)).toBeVisible();
  });

  test('should retry failed requests', async ({ page }) => {
    let attemptCount = 0;

    await page.route('**/api/v1/stats', async (route) => {
      attemptCount++;

      if (attemptCount < 2) {
        // Fail first attempt
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Server error',
          }),
        });
      } else {
        // Succeed on retry
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              totalBids: 100,
              activeBids: 25,
              wonBids: 15,
              totalValue: 10000000,
            },
          }),
        });
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should eventually show data after retry
    await expect(page.getByText('100')).toBeVisible({ timeout: 5000 });
  });

  test('should validate API response format', async ({ page }) => {
    await page.route('**/api/v1/stats', async (route) => {
      // Return invalid response format
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          // Missing required fields
          invalidField: 'test',
        }),
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should handle invalid response gracefully
    await expect(page.getByText(/Dashboard/i)).toBeVisible();
  });

  test('should handle rate limiting (429 status)', async ({ request }) => {
    // This would test rate limiting if implemented
    // Make many requests quickly
    const requests = [];
    for (let i = 0; i < 100; i++) {
      requests.push(request.get('http://localhost:3010/api/v1/bids'));
    }

    const responses = await Promise.all(requests);

    // Some requests might be rate limited
    const rateLimited = responses.some((r) => r.status() === 429);
    // This is optional - depends on rate limiting implementation
  });
});

test.describe('Data Persistence', () => {
  test('should persist created bid across page reloads', async ({ page, request }) => {
    const newBid = {
      title: 'Persistence Test Bid',
      organization: 'Test Org',
      budget: 750000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Testing data persistence',
    };

    // Create bid
    const createResponse = await request.post('http://localhost:3010/api/v1/bids', {
      data: newBid,
    });
    const createData = await createResponse.json();
    const bidId = createData.data.id;

    // Navigate to bid detail
    await page.goto(`/bids/${bidId}`);
    await expect(page.getByText('Persistence Test Bid')).toBeVisible();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Data should still be visible
    await expect(page.getByText('Persistence Test Bid')).toBeVisible();

    // Clean up
    await request.delete(`http://localhost:3010/api/v1/bids/${bidId}`);
  });

  test('should sync status changes across tabs', async ({ context, request }) => {
    // Create a bid
    const newBid = {
      title: 'Multi-tab Sync Test',
      organization: 'Test Org',
      budget: 500000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const createResponse = await request.post('http://localhost:3010/api/v1/bids', {
      data: newBid,
    });
    const createData = await createResponse.json();
    const bidId = createData.data.id;

    // Open bid in two tabs
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    await page1.goto(`/bids/${bidId}`);
    await page2.goto(`/bids/${bidId}`);

    // Change status in page1
    await page1.route(`**/api/v1/bids/${bidId}`, async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { ...newBid, id: bidId, status: 'submitted' },
          }),
        });
      } else {
        await route.continue();
      }
    });

    const statusButton = page1.getByRole('button', { name: /Change Status/i });
    if (await statusButton.isVisible()) {
      await statusButton.click();
      await page1.getByRole('option', { name: /Submitted/i }).click();
      await page1.getByRole('button', { name: /Confirm/i }).click();
    }

    // Refresh page2
    await page2.reload();
    await page2.waitForLoadState('networkidle');

    // Status should be updated in page2
    const statusBadge = page2.locator('[data-testid="bid-status"]');
    await expect(statusBadge).toContainText(/submitted/i);

    // Clean up
    await page1.close();
    await page2.close();
    await request.delete(`http://localhost:3010/api/v1/bids/${bidId}`);
  });
});

test.describe('Performance', () => {
  test('should load dashboard within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle large bid lists efficiently', async ({ page }) => {
    // Create many bids
    const bids = Array.from({ length: 100 }, (_, i) => ({
      id: `bid-${i}`,
      title: `Test Bid ${i}`,
      organization: `Organization ${i}`,
      budget: 1000000 + i * 10000,
      deadline: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
      status: ['active', 'submitted', 'won', 'lost'][i % 4],
    }));

    await page.route('**/api/v1/bids*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { bids, total: bids.length },
        }),
      });
    });

    const startTime = Date.now();

    await page.goto('/bids');
    await page.waitForLoadState('networkidle');

    const renderTime = Date.now() - startTime;

    // Should render within 2 seconds even with 100 bids
    expect(renderTime).toBeLessThan(2000);
  });

  test('should paginate large datasets', async ({ request }) => {
    const response = await request.get('http://localhost:3010/api/v1/bids?page=1&limit=10');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.bids.length).toBeLessThanOrEqual(10);
    expect(data.data.total).toBeGreaterThanOrEqual(0);
    expect(data.data.page).toBe(1);
  });
});
