/**
 * Test Helpers and Utilities
 */

export const TEST_USERS = {
  customer: {
    email: 'customer@example.com',
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'Customer',
  },
  hotelOwner: {
    email: 'owner@grandhotel.com',
    password: 'demo1234',
    firstName: 'Hotel',
    lastName: 'Owner',
  },
  admin: {
    email: 'admin@hotelplatform.com',
    password: 'admin1234',
    firstName: 'Admin',
    lastName: 'User',
  },
};

export const TEST_HOTEL = {
  name: 'Grand Plaza Hotel',
  city: 'New York',
  rating: 4,
};

export const TEST_CARD = {
  number: '4242424242424242',
  expMonth: '12',
  expYear: '2025',
  cvc: '123',
  zip: '12345',
};

/**
 * Format date for input fields (YYYY-MM-DD)
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get check-in date (7 days from now)
 */
export function getCheckInDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date;
}

/**
 * Get check-out date (9 days from now)
 */
export function getCheckOutDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 9);
  return date;
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(page: any, urlPattern: string | RegExp) {
  return page.waitForResponse((response: any) => {
    const url = response.url();
    if (typeof urlPattern === 'string') {
      return url.includes(urlPattern);
    }
    return urlPattern.test(url);
  });
}

/**
 * Take screenshot with timestamp
 */
export async function takeScreenshot(page: any, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  });
}
