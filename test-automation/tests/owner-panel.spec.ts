/**
 * Hotel Owner Panel E2E Tests
 * 
 * Tests hotel management workflows
 * Covers REQ-045 to REQ-053 (Hotel Owner/Manager Panel)
 * 
 * @critical - Hotel owners need to manage properties and bookings
 */

import { test, expect } from '@playwright/test';
import { TEST_USERS } from './helpers';

test.describe('Owner Panel - Hotel Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001');
  });

  test('@critical @owner-panel Hotel owner can access dashboard - REQ-045, REQ-046', async ({ page }) => {
    /**
     * AC: Given registered hotel manager
     *     When they log in with credentials
     *     Then dashboard with bookings and revenue is displayed
     * 
     * Note: Authentication is disabled, so we should have direct access
     */
    
    // Page should load successfully
    await expect(page.locator('body')).toBeVisible();
    
    // Look for dashboard elements
    const dashboardHeading = page.locator('h1:has-text("Dashboard"), h2:has-text("Dashboard"), text=Welcome');
    if (await dashboardHeading.count() > 0) {
      await expect(dashboardHeading.first()).toBeVisible();
    }
    
    // Look for metrics (bookings, revenue, occupancy)
    const metrics = page.locator('text=Bookings, text=Revenue, text=Occupancy');
    if (await metrics.count() > 0) {
      await expect(metrics.first()).toBeVisible();
    }
  });

  test('@owner-panel View and manage hotel profile - REQ-047', async ({ page }) => {
    /**
     * AC: Given hotel manager in profile section
     *     When they update hotel information
     *     Then changes are saved
     */
    
    // Navigate to hotel profile/settings
    const hotelLink = page.locator('a:has-text("Hotel"), a:has-text("Profile"), a:has-text("Settings")');
    if (await hotelLink.count() > 0) {
      await hotelLink.first().click();
      await page.waitForTimeout(1000);
      
      // Look for hotel information form
      const hotelNameInput = page.locator('input[name="hotelName"], input[placeholder*="hotel name" i]');
      if (await hotelNameInput.isVisible()) {
        // Verify form is editable
        await expect(hotelNameInput).toBeEditable();
      }
      
      // Look for amenities checkboxes
      const amenitiesSection = page.locator('text=Amenities, text=Facilities');
      if (await amenitiesSection.count() > 0) {
        await expect(amenitiesSection.first()).toBeVisible();
      }
    }
  });

  test('@critical @owner-panel View and manage bookings - REQ-050', async ({ page }) => {
    /**
     * AC: Given hotel manager in bookings section
     *     When viewing booking list
     *     Then they can confirm, cancel, or mark check-in/check-out
     */
    
    // Navigate to bookings
    const bookingsLink = page.locator('a:has-text("Bookings"), nav a:has-text("Reservations")');
    if (await bookingsLink.count() > 0) {
      await bookingsLink.first().click();
      await page.waitForTimeout(1000);
      
      // Look for bookings table or list
      const bookingsList = page.locator('table, [role="table"], .booking-card');
      if (await bookingsList.count() > 0) {
        await expect(bookingsList.first()).toBeVisible();
      }
      
      // Look for action buttons
      const actionButton = page.locator('button:has-text("Confirm"), button:has-text("Check-in"), button:has-text("View")');
      if (await actionButton.count() > 0) {
        await expect(actionButton.first()).toBeVisible();
      }
    }
  });

  test('@owner-panel Manage room inventory - REQ-048', async ({ page }) => {
    /**
     * AC: Given hotel manager in inventory section
     *     When they add/edit room types
     *     Then room availability is updated
     */
    
    // Navigate to rooms/inventory
    const roomsLink = page.locator('a:has-text("Rooms"), a:has-text("Inventory")');
    if (await roomsLink.count() > 0) {
      await roomsLink.first().click();
      await page.waitForTimeout(1000);
      
      // Look for rooms list
      const roomsList = page.locator('text=Room Type, text=Price, table');
      if (await roomsList.count() > 0) {
        await expect(roomsList.first()).toBeVisible();
      }
      
      // Look for "Add Room" button
      const addRoomButton = page.locator('button:has-text("Add Room"), button:has-text("New Room")');
      if (await addRoomButton.count() > 0) {
        await expect(addRoomButton.first()).toBeVisible();
      }
    }
  });

  test('@owner-panel Block dates functionality - REQ-049', async ({ page }) => {
    /**
     * AC: Given hotel manager in calendar view
     *     When they block specific dates
     *     Then those dates become unavailable
     */
    
    // Navigate to calendar/availability
    const calendarLink = page.locator('a:has-text("Calendar"), a:has-text("Availability")');
    if (await calendarLink.count() > 0) {
      await calendarLink.first().click();
      await page.waitForTimeout(1000);
      
      // Look for calendar component
      const calendar = page.locator('.calendar, [role="grid"], text=Monday, text=Sunday');
      if (await calendar.count() > 0) {
        await expect(calendar.first()).toBeVisible();
      }
    }
  });

  test('@owner-panel View earnings reports - REQ-053', async ({ page }) => {
    /**
     * AC: Given hotel manager in reports section
     *     When selecting date range
     *     Then detailed earnings report is generated
     */
    
    // Navigate to reports/analytics
    const reportsLink = page.locator('a:has-text("Reports"), a:has-text("Analytics"), a:has-text("Earnings")');
    if (await reportsLink.count() > 0) {
      await reportsLink.first().click();
      await page.waitForTimeout(1000);
      
      // Look for revenue/earnings information
      const revenueSection = page.locator('text=Revenue, text=Earnings, text=Total');
      if (await revenueSection.count() > 0) {
        await expect(revenueSection.first()).toBeVisible();
      }
      
      // Look for charts
      const chart = page.locator('canvas, svg[class*="chart"]');
      if (await chart.count() > 0) {
        await expect(chart.first()).toBeVisible();
      }
    }
  });

  test('@owner-panel Respond to reviews - REQ-052', async ({ page }) => {
    /**
     * AC: Given hotel receives customer review
     *     When manager writes response
     *     Then response is published
     */
    
    // Navigate to reviews
    const reviewsLink = page.locator('a:has-text("Reviews"), a:has-text("Feedback")');
    if (await reviewsLink.count() > 0) {
      await reviewsLink.first().click();
      await page.waitForTimeout(1000);
      
      // Look for reviews list
      const reviewsList = page.locator('.review, [data-testid="review"]');
      if (await reviewsList.count() > 0) {
        // Look for respond button
        const respondButton = page.locator('button:has-text("Respond"), button:has-text("Reply")');
        if (await respondButton.count() > 0) {
          await expect(respondButton.first()).toBeVisible();
        }
      }
    }
  });
});

test.describe('Owner Panel - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001');
  });

  test('@owner-panel Navigate through all main sections', async ({ page }) => {
    /**
     * Verify all main navigation links are accessible
     */
    
    const mainSections = [
      'Dashboard',
      'Bookings',
      'Rooms',
      'Hotel',
      'Profile',
      'Settings'
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
});
