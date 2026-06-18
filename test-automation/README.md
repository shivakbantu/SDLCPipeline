# Test Automation Suite

Comprehensive automated testing for the Hotel Booking Platform.

## Overview

This directory contains:
- **Frontend E2E Tests**: Playwright + TypeScript tests for all three frontends
- **Backend API Tests**: Pytest tests for microservices (located in `dev/tests/`)

## Test Structure

```
test-automation/
├── tests/
│   ├── helpers.ts              # Test utilities and constants
│   ├── booking-portal.spec.ts  # Customer booking flow tests
│   ├── owner-panel.spec.ts     # Hotel owner management tests
│   └── admin-panel.spec.ts     # Admin platform tests
├── playwright.config.ts         # Playwright configuration
├── package.json                 # NPM dependencies
└── tsconfig.json               # TypeScript configuration
```

## Requirements Coverage

### Frontend E2E Tests

| Test File | Requirements Covered | Priority |
|-----------|---------------------|----------|
| **booking-portal.spec.ts** | REQ-009 to REQ-044 | **CRITICAL** |
| - Search and browse | REQ-009 to REQ-019 | Must |
| - Hotel details | REQ-020 to REQ-027 | Must |
| - Booking flow | REQ-028 to REQ-037 | **CRITICAL** |
| **owner-panel.spec.ts** | REQ-045 to REQ-053 | **CRITICAL** |
| - Dashboard access | REQ-045, REQ-046 | Must |
| - Hotel management | REQ-047, REQ-048, REQ-049 | Must |
| - Booking management | REQ-050, REQ-051 | Must |
| **admin-panel.spec.ts** | REQ-054 to REQ-061 | **CRITICAL** |
| - User management | REQ-054 | Must |
| - Hotel approval | REQ-055, REQ-056 | Must |
| - Analytics | REQ-060 | Must |

### Backend API Tests

Located in `dev/tests/`:

| Test File | Coverage | Priority |
|-----------|----------|----------|
| **test_auth_service.py** | REQ-001 to REQ-008 | **CRITICAL** |
| **test_hotel_service.py** | REQ-020 to REQ-027 | Must |
| **test_booking_service.py** | REQ-028 to REQ-037, DR-03 | **CRITICAL** |
| **test_payment_service.py** | REQ-032 to REQ-034, NFR-007 | **CRITICAL** |

## Setup Instructions

### Frontend E2E Tests (Playwright)

1. **Install dependencies**:
   ```bash
   cd test-automation
   npm install
   ```

2. **Install Playwright browsers**:
   ```bash
   npx playwright install
   ```

3. **Ensure frontends are running**:
   - Booking Portal: http://localhost:3000
   - Owner Panel: http://localhost:3001
   - Admin Panel: http://localhost:3002

### Backend API Tests (Pytest)

1. **Install Python dependencies**:
   ```bash
   cd dev
   pip install pytest pytest-asyncio httpx fastapi[all]
   ```

2. **Ensure backend services are accessible** (or tests will use in-memory database)

## Running Tests

### Run All Frontend Tests

```bash
cd test-automation
npm test
```

### Run Tests by Application

```bash
# Booking Portal only
npm run test:booking-portal

# Owner Panel only
npm run test:owner-panel

# Admin Panel only
npm run test:admin-panel

# Critical tests only
npm run test:critical
```

### Run Tests in UI Mode

```bash
npm run test:ui
```

### Run Tests in Debug Mode

```bash
npm run test:debug
```

### Run Backend Tests

```bash
cd dev
pytest tests/ -v
```

### Run Specific Backend Test File

```bash
cd dev
pytest tests/test_auth_service.py -v
pytest tests/test_booking_service.py::TestInventoryLocking -v
```

## Test Execution Strategy

### Phase 1: Backend API Tests (Smoke)
Run backend tests first to verify API endpoints work:
```bash
cd dev
pytest tests/ -v --tb=short
```

### Phase 2: Frontend E2E Tests (Critical Path)
Run critical customer booking flow:
```bash
cd test-automation
npm run test:critical
```

### Phase 3: Full Test Suite
Run all tests across all browsers:
```bash
npm test
```

## Test Reports

### Frontend (Playwright)

After running tests, view the HTML report:
```bash
npm run test:report
```

Reports are saved to:
- `test-automation/playwright-report/` - HTML report
- `test-automation/test-results/` - Screenshots and videos

### Backend (Pytest)

Pytest outputs results to console by default. For HTML reports:
```bash
pip install pytest-html
pytest tests/ --html=test-results/report.html
```

## Priority Test Scenarios

### ⚠️ CRITICAL - Must Pass

1. **Customer Booking Flow** (booking-portal.spec.ts)
   - Search hotels → View details → Book room → Complete payment
   - REQ-009, REQ-020, REQ-028, REQ-032

2. **Inventory Locking** (test_booking_service.py)
   - Prevents double-booking (DR-03)
   - Concurrent booking attempts

3. **Authentication** (test_auth_service.py)
   - User registration and login
   - JWT token validation

4. **Hotel Owner Dashboard** (owner-panel.spec.ts)
   - View bookings and manage property
   - REQ-045, REQ-050

5. **Admin Hotel Approval** (admin-panel.spec.ts)
   - Approve/reject hotel listings
   - REQ-055

### 🔴 HIGH Priority

- Payment processing (test_payment_service.py)
- Hotel search with filters (booking-portal.spec.ts)
- Room availability checking (test_hotel_service.py)
- Booking cancellation (test_booking_service.py)

### 🟡 MEDIUM Priority

- Review management
- Promo code application
- Report generation
- Navigation flows

## Known Limitations

1. **Authentication Disabled**: Frontend tests run with authentication disabled (direct access mode)
2. **Mock Payments**: Payment tests use Stripe test cards (4242 4242 4242 4242)
3. **Seeded Data**: Tests rely on seeded database data (Grand Plaza Hotel, demo users)
4. **Network Speed**: Search performance tests may fail on slow networks (NFR-001: <2s)

## Troubleshooting

### Frontend Tests Failing

**Issue**: Tests timeout waiting for elements

**Solution**:
1. Verify frontends are running on correct ports
2. Check browser console for errors
3. Run in headed mode to see what's happening:
   ```bash
   npm run test:headed
   ```

### Backend Tests Failing

**Issue**: Import errors or missing dependencies

**Solution**:
1. Ensure you're running from `dev/` directory
2. Install all dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Check Python path includes `dev/` directory

### Service Connection Errors

**Issue**: Cannot connect to backend services

**Solution**:
- Backend tests use in-memory SQLite by default
- Frontend tests require services running (or will show connection errors but test structure)

## Performance Benchmarks

Based on NFR requirements:

| Metric | Target | Test |
|--------|--------|------|
| Search latency | < 2 seconds | booking-portal.spec.ts search test |
| Payment processing | < 5 seconds | test_payment_service.py |
| API response (p95) | < 500ms | Backend tests measure response time |

## Continuous Integration

For CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Backend Tests
  run: |
    cd dev
    pip install -r requirements.txt
    pytest tests/ -v

- name: Run Frontend Tests
  run: |
    cd test-automation
    npm install
    npx playwright install --with-deps
    npm test
```

## Contact

For test failures or questions:
- Review test output and screenshots in `test-results/`
- Check application logs
- Verify seeded data exists (run `python dev/seed_database.py`)
