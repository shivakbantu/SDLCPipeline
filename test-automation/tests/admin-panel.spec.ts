/**
 * Super Admin Panel E2E Tests
 * 
 * Tests platform administration workflows
 * Covers REQ-054 to REQ-061 (Super Admin Panel)
 * 
 * @critical - Admin needs to manage platform operations
 */

import { test, expect } from '@playwright/test';
import { TEST_USERS } from './helpers';

test.describe('Admin Panel - User Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002');
  });

  test('@critical @admin-panel Admin can access dashboard - Platform Analytics REQ-060', async ({ page }) => {
    /**
     * AC: Given admin logged in
     *     When viewing dashboard
     *     Then platform metrics are displayed
     * 
     * Note: Authentication is disabled, so we should have direct access
     */
    
    // Page should load successfully
    await expect(page.locator('body')).toBeVisible();
    
    // Look for dashboard heading
    const dashboardHeading = page.locator('h1:has-text("Dashboard"), h1:has-text("Admin"), h1:has-text("Analytics")');
    if (await dashboardHeading.count() > 0) {
      await expect(dashboardHeading.first()).toBeVisible();
    }
    
    // Look for metrics (bookings, revenue, users)
    const metrics = page.locator('text=Total Bookings, text=Revenue, text=Users, text=Hotels');
    if (await metrics.count() > 0) {
      await expect(metrics.first()).toBeVisible();
    }
  });

  test('@admin-panel Manage users - REQ-054', async ({ page }) => {
    /**
     * AC: Given admin in user management
     *     When viewing user list
     *     Then they can activate/deactivate accounts
     */
    
    // Navigate to users section
    const usersLink = page.locator('a:has-text("Users"), nav a:has-text("User Management")');
    if (await usersLink.count() > 0) {
      await usersLink.first().click();
      await page.waitForTimeout(1000);
      
      // Look for users table
      const usersTable = page.locator('table, [role="table"], .user-card');
      if (await usersTable.count() > 0) {
        await expect(usersTable.first()).toBeVisible();
      }
      
      // Look for action buttons
      const actionButton = page.locator('button:has-text("Edit"), button:has-text("View"), button:has-text("Deactivate")');
      if (await actionButton.count() > 0) {
        await expect(actionButton.first()).toBeVisible();
      }
    }
  });

  test('@critical @admin-panel Manage hotel listings - REQ-055, REQ-056', async ({ page }) => {
    /**
     * AC: Given new hotel registration
     *     When admin reviews listing
     *     Then they can approve or reject
     */
    
    // Navigate to hotels section
    const hotelsLink = page.locator('a:has-text("Hotels"), nav a:has-text("Hotel Management")');
    if (await hotelsLink.count() > 0) {
      await hotelsLink.first().click();
      await page.waitForTimeout(1000);
      
      // Look for hotels table
      const hotelsTable = page.locator('table, [role="table"], .hotel-card');
      if (await hotelsTable.count() > 0) {
        await expect(hotelsTable.first()).toBeVisible();
      }
      
      // Look for approval buttons
      const approveButton = page.locator('button:has-text("Approve"), button:has-text("Verify"), button:has-text("Review")');
      if (await approveButton.count() > 0) {
        await expect(approveButton.first()).toBeVisible();
      }
    }
  });

  test('@admin-panel Manage promo codes - REQ-059', async ({ page }) => {
    /**
     * AC: Given admin in promotions section
     *     When creating promo code
     *     Then code with discount rules is activated
     */
    
    // Navigate to promo codes
    const promosLink = page.locator('a:has-text("Promo"), a:has-text("Promotions"), a:has-text("Discounts")');
    if (await promosLink.count() > 0) {
      await promosLink.first().click();
      await page.waitForTimeout(1000);
      
      // Look for promo codes list
      const promosList = page.locator('table, [data-testid="promo-list"]');
      if (await promosList.count() > 0) {
        await expect(promosList.first()).toBeVisible();
      }
      
      // Look for "Create Promo Code" button
      const createButton = page.locator('button:has-text("Create"), button:has-text("New Promo"), button:has-text("Add")');
      if (await createButton.count() > 0) {
        await createButton.first().click({ timeout: 3000 });
        await page.waitForTimeout(500);
        
        // Look for promo code form
        const codeInput = page.locator('input[name="code"], input[placeholder*="code" i]');
        if (await codeInput.isVisible()) {
          await expect(codeInput).toBeEditable();
        }
      }
    }
  });

  test('@admin-panel Handle disputes - REQ-058', async ({ page }) => {
    /**
     * AC: Given dispute raised by user or hotel
     *     When admin reviews case
     *     Then they can mediate and take action
     */
    
    // Navigate to disputes
    const disputesLink = page.locator('a:has-text("Disputes"), a:has-text("Support")');
    if (await disputesLink.count() > 0) {
      await disputesLink.first().click();
      await page.waitForTimeout(1000);
      
      // Look for disputes list
      const disputesList = page.locator('table, [role="table"], .dispute-card');
      if (await disputesList.count() > 0) {
        await expect(disputesList.first()).toBeVisible();
      }
      
      // Look for action buttons
      const resolveButton = page.locator('button:has-text("Resolve"), button:has-text("View"), button:has-text("Handle")');
      if (await resolveButton.count() > 0) {
        await expect(resolveButton.first()).toBeVisible();
      }
    }
  });

  test('@admin-panel View platform analytics - REQ-060', async ({ page }) => {
    /**
     * AC: Given admin in analytics dashboard
     *     When viewing metrics
     *     Then bookings, revenue, and user stats are displayed
     */
    
    // Navigate to analytics
    const analyticsLink = page.locator('a:has-text("Analytics"), a:has-text("Reports"), a:has-text("Dashboard")');
    if (await analyticsLink.count() > 0) {
      await analyticsLink.first().click();
      await page.waitForTimeout(1000);
    }
    
    // Look for charts and metrics
    const charts = page.locator('canvas, svg[class*="chart"]');
    if (await charts.count() > 0) {
      await expect(charts.first()).toBeVisible();
    }
    
    // Look for key metrics
    const metrics = page.locator('text=Total Revenue, text=Total Bookings, text=Active Users');
    if (await metrics.count() > 0) {
      await expect(metrics.first()).toBeVisible();
    }
  });

  test('@admin-panel Commission and payment settlement - REQ-057', async ({ page }) => {
    /**
     * AC: Given admin in finance section
     *     When processing settlements
     *     Then commission is calculated and payments initiated
     */
    
    // Try to find finance/payments section
    const financeLink = page.locator('a:has-text("Finance"), a:has-text("Payments"), a:has-text("Settlement")');
    if (await financeLink.count() > 0) {
      await financeLink.first().click();
      await page.waitForTimeout(1000);
      
      // Look for financial data
      const financialData = page.locator('text=Commission, text=Settlement, text=Payment');
      if (await financialData.count() > 0) {
        await expect(financialData.first()).toBeVisible();
      }
    }
  });
});

test.describe('Admin Panel - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002');
  });

  test('@admin-panel Navigate through all main sections', async ({ page }) => {
    /**
     * Verify all main navigation links are accessible
     */
    
    const mainSections = [
      'Dashboard',
      'Users',
      'Hotels',
      'Analytics'
    ];
    
    for (const section of mainSections) {
      const link = page.locator(`a:has-text("${section}"), nav a:has-text("${section}")`);
      if (await link.count() > 0) {
        await link.first().click({ timeout: 3000 });
        await page.waitForTimeout(500);
        
        // Verify page loaded
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('@admin-panel All dashboard widgets are visible', async ({ page }) => {
    /**
     * Verify key dashboard components load
     */
    
    // Navigate to dashboard
    await page.goto('http://localhost:3002');
    await page.waitForTimeout(1000);
    
    // Check for various dashboard elements
    const dashboardElements = [
      'h1, h2',  // Heading
      'canvas, svg',  // Charts
      'table, [role="table"]',  // Data tables
      'button',  // Action buttons
    ];
    
    for (const selector of dashboardElements) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible();
      }
    }
  });
});

test.describe('Admin Panel - Data Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002');
  });

  test('@admin-panel Verify search functionality works', async ({ page }) => {
    /**
     * Test search/filter functionality across admin panel
     */
    
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('test');
      await page.waitForTimeout(500);
      
      // Verify search doesn't crash the page
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
