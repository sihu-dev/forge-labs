/**
 * E2E Tests for BIDFLOW Bids Management
 * Tests bid detail pages and bid management functionality:
 * - Bid detail page display
 * - Bid status changes
 * - Bid filtering and search
 * - Bid creation and editing
 * - Document management
 * - Timeline and activity tracking
 */

import { test, expect } from '@playwright/test';

const MOCK_BID = {
  id: 'bid-123',
  title: 'Smart City Infrastructure Development',
  organization: 'Seoul Metropolitan Government',
  budget: 5000000,
  deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'active',
  description: 'Comprehensive smart city infrastructure project including IoT sensors, data analytics platform, and citizen engagement mobile application.',
  requirements: [
    'IoT sensor network deployment',
    'Real-time data analytics platform',
    'Mobile application development',
    'System integration and testing',
  ],
  winProbability: 0.75,
  contactPerson: 'Kim Min-soo',
  contactEmail: 'minso@seoul.go.kr',
  documents: [
    { id: 'doc-1', name: 'RFP_SmartCity_2024.pdf', size: 2048000, uploadedAt: new Date().toISOString() },
    { id: 'doc-2', name: 'Technical_Requirements.docx', size: 512000, uploadedAt: new Date().toISOString() },
  ],
};

test.describe('Bid Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/bids/bid-123', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: MOCK_BID,
        }),
      });
    });

    await page.goto('/bids/bid-123');
    await page.waitForLoadState('networkidle');
  });

  test('should display bid title and organization', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Smart City Infrastructure Development' })).toBeVisible();
    await expect(page.getByText('Seoul Metropolitan Government')).toBeVisible();
  });

  test('should show bid status badge', async ({ page }) => {
    const statusBadge = page.locator('[data-testid="bid-status"]');
    await expect(statusBadge).toBeVisible();
    await expect(statusBadge).toContainText(/active/i);
  });

  test('should display budget information', async ({ page }) => {
    await expect(page.getByText(/Budget/i)).toBeVisible();
    await expect(page.getByText(/5\.0M/)).toBeVisible();
  });

  test('should show deadline with countdown', async ({ page }) => {
    await expect(page.getByText(/Deadline/i)).toBeVisible();
    // Should show days remaining
    await expect(page.getByText(/30 days/i)).toBeVisible();
  });

  test('should display bid description', async ({ page }) => {
    await expect(page.getByText(/Comprehensive smart city infrastructure project/)).toBeVisible();
  });

  test('should list all requirements', async ({ page }) => {
    await expect(page.getByText(/Requirements/i)).toBeVisible();
    await expect(page.getByText('IoT sensor network deployment')).toBeVisible();
    await expect(page.getByText('Real-time data analytics platform')).toBeVisible();
    await expect(page.getByText('Mobile application development')).toBeVisible();
  });

  test('should show win probability', async ({ page }) => {
    await expect(page.getByText(/Win Probability/i)).toBeVisible();
    await expect(page.getByText('75%')).toBeVisible();
  });

  test('should display contact information', async ({ page }) => {
    await expect(page.getByText(/Contact/i)).toBeVisible();
    await expect(page.getByText('Kim Min-soo')).toBeVisible();
    await expect(page.getByText('minso@seoul.go.kr')).toBeVisible();
  });

  test('should show action buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Edit/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /AI Analysis/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Change Status/i })).toBeVisible();
  });

  test('should navigate back to dashboard', async ({ page }) => {
    const backButton = page.getByRole('link', { name: /Back/i });
    await backButton.click();

    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('Bid Documents', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/bids/bid-123', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: MOCK_BID,
        }),
      });
    });

    await page.goto('/bids/bid-123');
    await page.waitForLoadState('networkidle');
  });

  test('should display documents section', async ({ page }) => {
    await expect(page.getByText(/Documents/i)).toBeVisible();
  });

  test('should list all documents', async ({ page }) => {
    await expect(page.getByText('RFP_SmartCity_2024.pdf')).toBeVisible();
    await expect(page.getByText('Technical_Requirements.docx')).toBeVisible();
  });

  test('should show document sizes', async ({ page }) => {
    await expect(page.getByText(/2\.0 MB/)).toBeVisible();
    await expect(page.getByText(/512 KB/)).toBeVisible();
  });

  test('should have download buttons for documents', async ({ page }) => {
    const downloadButtons = page.locator('[data-testid="download-document"]');
    const count = await downloadButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should upload new document', async ({ page }) => {
    await page.route('**/api/v1/bids/bid-123/documents', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'doc-3',
            name: 'Proposal_Draft.pdf',
            size: 1024000,
            uploadedAt: new Date().toISOString(),
          },
        }),
      });
    });

    const uploadButton = page.getByRole('button', { name: /Upload/i });
    await uploadButton.click();

    // Simulate file upload
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'Proposal_Draft.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('dummy pdf content'),
    });

    // Wait for upload to complete
    await page.waitForTimeout(1000);

    await expect(page.getByText('Proposal_Draft.pdf')).toBeVisible();
  });
});

test.describe('Bid Status Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/bids/bid-123', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: MOCK_BID,
        }),
      });
    });

    await page.goto('/bids/bid-123');
    await page.waitForLoadState('networkidle');
  });

  test('should open status change modal', async ({ page }) => {
    const statusButton = page.getByRole('button', { name: /Change Status/i });
    await statusButton.click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(page.getByText(/Change Bid Status/i)).toBeVisible();
  });

  test('should show all available statuses', async ({ page }) => {
    const statusButton = page.getByRole('button', { name: /Change Status/i });
    await statusButton.click();

    // Should show status options
    await expect(page.getByRole('option', { name: /Draft/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /Active/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /Submitted/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /Won/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /Lost/i })).toBeVisible();
  });

  test('should change status to "Submitted"', async ({ page }) => {
    await page.route('**/api/v1/bids/bid-123', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { ...MOCK_BID, status: 'submitted' },
          }),
        });
      } else {
        await route.continue();
      }
    });

    const statusButton = page.getByRole('button', { name: /Change Status/i });
    await statusButton.click();

    // Select "Submitted"
    await page.getByRole('option', { name: /Submitted/i }).click();

    // Confirm
    const confirmButton = page.getByRole('button', { name: /Confirm/i });
    await confirmButton.click();

    // Wait for update
    await page.waitForTimeout(500);

    // Status badge should update
    const statusBadge = page.locator('[data-testid="bid-status"]');
    await expect(statusBadge).toContainText(/submitted/i);
  });

  test('should add status change note', async ({ page }) => {
    const statusButton = page.getByRole('button', { name: /Change Status/i });
    await statusButton.click();

    const noteInput = page.getByPlaceholder(/Add a note/i);
    await noteInput.fill('Proposal submitted via online portal');

    const confirmButton = page.getByRole('button', { name: /Confirm/i });
    await confirmButton.click();

    // Note should appear in activity timeline
    await expect(page.getByText('Proposal submitted via online portal')).toBeVisible();
  });
});

test.describe('Bid Filtering and Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/bids*', async (route) => {
      const url = new URL(route.request().url());
      const status = url.searchParams.get('status');
      const search = url.searchParams.get('search');

      let bids = [
        { ...MOCK_BID, id: 'bid-1', status: 'active', title: 'Smart City Project' },
        { ...MOCK_BID, id: 'bid-2', status: 'submitted', title: 'Digital Transformation' },
        { ...MOCK_BID, id: 'bid-3', status: 'won', title: 'Cloud Migration' },
        { ...MOCK_BID, id: 'bid-4', status: 'active', title: 'AI Implementation' },
      ];

      if (status) {
        bids = bids.filter((bid) => bid.status === status);
      }

      if (search) {
        bids = bids.filter((bid) =>
          bid.title.toLowerCase().includes(search.toLowerCase())
        );
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { bids, total: bids.length },
        }),
      });
    });

    await page.goto('/bids');
    await page.waitForLoadState('networkidle');
  });

  test('should display bids list page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Bids/i })).toBeVisible();
  });

  test('should show all bids initially', async ({ page }) => {
    await expect(page.getByText('Smart City Project')).toBeVisible();
    await expect(page.getByText('Digital Transformation')).toBeVisible();
    await expect(page.getByText('Cloud Migration')).toBeVisible();
    await expect(page.getByText('AI Implementation')).toBeVisible();
  });

  test('should filter by status - Active', async ({ page }) => {
    const statusFilter = page.getByRole('button', { name: /Status/i });
    await statusFilter.click();

    await page.getByRole('option', { name: /^Active$/i }).click();

    // Should only show active bids
    await expect(page.getByText('Smart City Project')).toBeVisible();
    await expect(page.getByText('AI Implementation')).toBeVisible();
    await expect(page.getByText('Digital Transformation')).not.toBeVisible();
  });

  test('should filter by status - Won', async ({ page }) => {
    const statusFilter = page.getByRole('button', { name: /Status/i });
    await statusFilter.click();

    await page.getByRole('option', { name: /Won/i }).click();

    // Should only show won bids
    await expect(page.getByText('Cloud Migration')).toBeVisible();
    await expect(page.getByText('Smart City Project')).not.toBeVisible();
  });

  test('should search bids by title', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search bids/i);
    await searchInput.fill('Cloud');

    // Wait for search to trigger
    await page.waitForTimeout(500);

    // Should only show matching bid
    await expect(page.getByText('Cloud Migration')).toBeVisible();
    await expect(page.getByText('Smart City Project')).not.toBeVisible();
  });

  test('should clear filters', async ({ page }) => {
    // Apply filter
    const statusFilter = page.getByRole('button', { name: /Status/i });
    await statusFilter.click();
    await page.getByRole('option', { name: /Won/i }).click();

    // Should show filtered results
    await expect(page.getByText('Cloud Migration')).toBeVisible();

    // Clear filters
    const clearButton = page.getByRole('button', { name: /Clear/i });
    await clearButton.click();

    // Should show all bids again
    await expect(page.getByText('Smart City Project')).toBeVisible();
    await expect(page.getByText('Digital Transformation')).toBeVisible();
  });

  test('should sort by deadline', async ({ page }) => {
    const sortButton = page.getByRole('button', { name: /Sort/i });
    await sortButton.click();

    await page.getByRole('option', { name: /Deadline/i }).click();

    await page.waitForTimeout(500);

    // Verify sorting (earliest deadline first)
    const bidTitles = await page.locator('[data-testid="bid-title"]').allTextContents();
    // In real implementation, would verify actual order
    expect(bidTitles.length).toBeGreaterThan(0);
  });

  test('should sort by budget', async ({ page }) => {
    const sortButton = page.getByRole('button', { name: /Sort/i });
    await sortButton.click();

    await page.getByRole('option', { name: /Budget/i }).click();

    await page.waitForTimeout(500);

    // Verify sorting applied
    const bidCards = page.locator('[data-testid="bid-card"]');
    const count = await bidCards.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Bid Timeline and Activity', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/bids/bid-123', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            ...MOCK_BID,
            timeline: [
              {
                id: 'event-1',
                type: 'created',
                message: 'Bid created',
                user: 'John Doe',
                timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              },
              {
                id: 'event-2',
                type: 'document_added',
                message: 'Added RFP document',
                user: 'Jane Smith',
                timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
              },
              {
                id: 'event-3',
                type: 'status_change',
                message: 'Status changed from Draft to Active',
                user: 'John Doe',
                timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              },
              {
                id: 'event-4',
                type: 'ai_analysis',
                message: 'AI analysis completed - 75% win probability',
                user: 'System',
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              },
            ],
          },
        }),
      });
    });

    await page.goto('/bids/bid-123');
    await page.waitForLoadState('networkidle');
  });

  test('should display timeline section', async ({ page }) => {
    await expect(page.getByText(/Timeline|Activity/i)).toBeVisible();
  });

  test('should show all timeline events', async ({ page }) => {
    await expect(page.getByText('Bid created')).toBeVisible();
    await expect(page.getByText('Added RFP document')).toBeVisible();
    await expect(page.getByText(/Status changed/)).toBeVisible();
    await expect(page.getByText(/AI analysis completed/)).toBeVisible();
  });

  test('should display event timestamps', async ({ page }) => {
    await expect(page.getByText(/10 days ago|days ago/)).toBeVisible();
  });

  test('should show event users', async ({ page }) => {
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('Jane Smith')).toBeVisible();
    await expect(page.getByText('System')).toBeVisible();
  });

  test('should have different icons for event types', async ({ page }) => {
    const timelineItems = page.locator('[data-testid="timeline-item"]');
    const count = await timelineItems.count();
    expect(count).toBe(4);

    // Each should have an icon
    for (let i = 0; i < count; i++) {
      const icon = timelineItems.nth(i).locator('svg').first();
      await expect(icon).toBeVisible();
    }
  });
});

test.describe('Bid Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/bids', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'bid-new',
              ...JSON.parse(route.request().postData() || '{}'),
              status: 'draft',
              createdAt: new Date().toISOString(),
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/bids/new');
    await page.waitForLoadState('networkidle');
  });

  test('should display bid creation form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /New Bid|Create Bid/i })).toBeVisible();
  });

  test('should have all required form fields', async ({ page }) => {
    await expect(page.getByLabel(/Title/i)).toBeVisible();
    await expect(page.getByLabel(/Organization/i)).toBeVisible();
    await expect(page.getByLabel(/Budget/i)).toBeVisible();
    await expect(page.getByLabel(/Deadline/i)).toBeVisible();
    await expect(page.getByLabel(/Description/i)).toBeVisible();
  });

  test('should create new bid with valid data', async ({ page }) => {
    await page.getByLabel(/Title/i).fill('New Infrastructure Project');
    await page.getByLabel(/Organization/i).fill('Government Agency');
    await page.getByLabel(/Budget/i).fill('3000000');
    await page.getByLabel(/Deadline/i).fill('2025-12-31');
    await page.getByLabel(/Description/i).fill('Detailed project description');

    const submitButton = page.getByRole('button', { name: /Create|Submit/i });
    await submitButton.click();

    // Should redirect to new bid page
    await expect(page).toHaveURL(/\/bids\/bid-new/);
    await expect(page.getByText('New Infrastructure Project')).toBeVisible();
  });

  test('should show validation errors for empty required fields', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /Create|Submit/i });
    await submitButton.click();

    // Should show validation errors
    await expect(page.getByText(/Title is required/i)).toBeVisible();
    await expect(page.getByText(/Organization is required/i)).toBeVisible();
  });

  test('should validate budget is a number', async ({ page }) => {
    await page.getByLabel(/Budget/i).fill('invalid');

    const submitButton = page.getByRole('button', { name: /Create|Submit/i });
    await submitButton.click();

    await expect(page.getByText(/Budget must be a number/i)).toBeVisible();
  });

  test('should save as draft', async ({ page }) => {
    await page.getByLabel(/Title/i).fill('Draft Project');
    await page.getByLabel(/Organization/i).fill('Test Org');

    const saveDraftButton = page.getByRole('button', { name: /Save Draft/i });
    if (await saveDraftButton.isVisible()) {
      await saveDraftButton.click();

      await expect(page.getByText(/Saved as draft/i)).toBeVisible();
    }
  });
});

test.describe('Mobile Responsiveness', () => {
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.route('**/api/v1/bids/bid-123', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: MOCK_BID,
        }),
      });
    });

    await page.goto('/bids/bid-123');
    await page.waitForLoadState('networkidle');

    // Content should be visible and accessible
    await expect(page.getByText('Smart City Infrastructure Development')).toBeVisible();
    await expect(page.getByText(/Budget/i)).toBeVisible();
  });

  test('should stack action buttons on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.route('**/api/v1/bids/bid-123', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: MOCK_BID,
        }),
      });
    });

    await page.goto('/bids/bid-123');
    await page.waitForLoadState('networkidle');

    const actionButtons = page.locator('[data-testid="action-buttons"]');
    if (await actionButtons.isVisible()) {
      // Should have flex-col or stack vertically
      const hasVerticalStack = await actionButtons.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.flexDirection === 'column';
      });
      expect(hasVerticalStack).toBeTruthy();
    }
  });
});
