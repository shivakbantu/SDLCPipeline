# Implementation Plan — Hotel Booking Platform

**Document Version:** 1.0  
**Date:** June 17, 2026  
**Status:** Approved for Implementation  
**Timeline:** 6 months (26 weeks), 10 sprints (2 weeks each + 6-week buffer)  
**Team Size:** 8-10 engineers (2 mobile, 3 backend, 2 frontend, 1 DevOps, 2 QA)

---

## Executive Summary

This implementation plan decomposes the approved architecture ([architecture.md](architecture.md)) into 76 implementation tasks spanning 10 sprints. The plan addresses all 61 functional requirements and 22 non-functional requirements documented in [requirements.md](requirements.md), while resolving 4 critical (P1) findings from the design review ([design-review.md](design-review.md)).

### Key Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| **Total Tasks** | 76 | Broken into atomic, testable units |
| **Total Sprints** | 10 (2 weeks each) | Sprint 0-9, plus 6-week hardening buffer |
| **Timeline** | 26 weeks (6 months) | 20 weeks implementation + 6 weeks testing/hardening |
| **Critical Path Duration** | 22 weeks | Sprint 0-7 (infrastructure → core services → integration) |
| **Team Velocity** | 7-8 tasks/sprint | Assumes 8-person team |
| **MVP Readiness** | Week 24 | Beta launch target |
| **Production Launch** | Week 26 | After final load testing & hardening |

### Timeline Overview

```
Sprint 0 (Weeks 1-2):   Infrastructure, DevOps, P1 Findings Resolution
Sprint 1 (Weeks 3-4):   Auth Service, User Service, Database Foundation
Sprint 2 (Weeks 5-6):   Hotel Service, Search Service (Elasticsearch)
Sprint 3 (Weeks 7-8):   Booking Service, Payment Service Integration
Sprint 4 (Weeks 9-10):  Review Service, Notification Service
Sprint 5 (Weeks 11-12): Mobile App (Phase 1: Auth, Search, Hotel Details)
Sprint 6 (Weeks 13-14): Mobile App (Phase 2: Booking, Payment, Profile)
Sprint 7 (Weeks 15-16): Web Admin Panels (Hotel Manager, Super Admin)
Sprint 8 (Weeks 17-18): Analytics Service, Reporting, Admin Features
Sprint 9 (Weeks 19-20): Integration Testing, Bug Fixes, Performance Tuning
Buffer  (Weeks 21-26):  Load Testing, Security Audit, Hardening, Beta Launch
```

### Critical Path

The following tasks are on the critical path (any delay impacts launch):
1. **Infrastructure Setup** (Sprint 0) → Blocks all development
2. **Auth Service** (Sprint 1) → Required by all authenticated endpoints
3. **Hotel Service** (Sprint 2) → Required for search and booking
4. **Booking Service** (Sprint 3) → Core revenue-generating feature
5. **Payment Integration** (Sprint 3) → Required for booking completion
6. **Mobile App Phase 1-2** (Sprints 5-6) → Primary customer interface
7. **Load Testing** (Week 21-22) → Validates NFR-004 (100K concurrent users)

### Team Allocation

| Role | Count | Primary Responsibilities |
|------|-------|-------------------------|
| **Backend Engineers** | 3 | Microservices development (Node.js/Express), API design, database schema |
| **Mobile Engineers** | 2 | Flutter app development (iOS/Android), offline mode, push notifications |
| **Frontend Engineers** | 2 | React web panels (Hotel Manager, Super Admin), dashboards, reports |
| **DevOps Engineer** | 1 | AWS infrastructure (Terraform), CI/CD pipelines, monitoring, security |
| **QA Engineers** | 2 | Test automation (Playwright), load testing, security testing, manual QA |
| **Tech Lead** | 1 | Architecture decisions, code reviews, unblocking, P1 issue resolution |

---

## 1. P1 Findings Resolution

The design review ([design-review.md](design-review.md)) identified 4 critical (P1) findings that must be resolved during Sprint 0 before core development begins.

### DR-01: Data Retention Policy Contradiction

**Issue:** GDPR Right to Erasure conflicts with financial regulations requiring 7-year booking record retention.

**Resolution (Sprint 0, TASK-002):**
- **Approach:** Data Anonymization Strategy
- **Implementation:**
  1. When user exercises GDPR right to deletion:
     - **Soft delete** user profile (mark `deleted_at` timestamp)
     - **Anonymize PII** in booking/payment records:
       - Replace `first_name`, `last_name` → "Deleted User"
       - Replace `email` → `deleted_<user_id>@anonymized.local`
       - Replace `phone` → NULL
       - Retain transaction IDs, amounts, dates (required for financial audits)
     - **Delete** authentication credentials, social tokens, payment methods
     - **Purge** from cache (Redis), search index (Elasticsearch)
  2. After 30-day soft delete period:
     - **Hard delete** user profile, sessions, preferences
     - Retain anonymized booking/payment records for 7 years per financial regulations
  3. Update privacy policy to disclose anonymization approach
- **Deliverable:** `dev/services/user-service/data-retention-policy.py` documenting anonymization logic
- **Acceptance Criteria:**
  - Privacy policy updated and reviewed by legal counsel
  - Anonymization script tested with sample data
  - Audit log confirms PII removal while retaining transaction records
- **Requirements Addressed:** NFR-010 (GDPR/CCPA compliance)
- **Status:** Assigned to Tech Lead + Legal Review (Sprint 0)

---

### DR-02: Elasticsearch Cluster Sizing Validation

**Issue:** 3-node Elasticsearch cluster (r6g.xlarge.search) may not handle 100K concurrent users with <2s search latency.

**Resolution (Sprint 0, TASK-004 + Sprint 9, TASK-053):**
- **Phase 1 (Sprint 0):** Baseline Testing
  1. Provision 3-node Elasticsearch cluster with sample dataset (10K hotels, 100K bookings)
  2. Run load test with 1K concurrent users, complex queries (price + rating + amenities filters)
  3. Measure query latency (p50, p95, p99), CPU utilization, JVM heap usage
  4. Establish baseline metrics
- **Phase 2 (Sprint 9):** Full-Scale Load Testing
  1. Index production-scale dataset (100K hotels, 1M bookings)
  2. Simulate 100K concurrent users (10% searching = 10K concurrent searches)
  3. Validate <2s p95 latency target (NFR-001)
  4. If target not met, scale to 5-node cluster or upgrade to r6g.2xlarge instances
- **Deliverable:** `test-automation/load-tests/elasticsearch-sizing-test.spec.ts` (Playwright + k6)
- **Acceptance Criteria:**
  - Load test report confirms <2s p95 latency at 10K QPS
  - CPU utilization < 80% under load
  - JVM heap < 75% under load
  - If targets not met, cluster resized and re-tested
- **Requirements Addressed:** NFR-001 (search performance), NFR-004 (concurrent users)
- **Status:** Phase 1 in Sprint 0, Phase 2 in Sprint 9

---

### DR-03: Inventory Double-Booking Prevention

**Issue:** Race condition where two users simultaneously book the last available room.

**Resolution (Sprint 3, TASK-021 + TASK-022):**
- **Approach:** Distributed Locking with Redis RedLock
- **Implementation:**
  1. When user selects room, create "booking draft" in PostgreSQL with status `draft`
  2. Acquire distributed lock in Redis:
     - Key: `lock:hotel:{hotel_id}:room:{room_type}:date:{date_range}`
     - Value: `{booking_draft_id}:{user_id}:{timestamp}`
     - TTL: 10 minutes (extendable)
  3. If lock acquisition fails → return 409 Conflict "Room no longer available"
  4. If lock acquired → decrement available inventory (optimistic)
  5. On payment page load, renew lock (+5 minutes if user active)
  6. On payment success:
     - Atomically decrement inventory in PostgreSQL
     - Update booking status to `confirmed`
     - Release Redis lock
  7. On payment failure or timeout:
     - Lock expires automatically (inventory restored)
     - Booking draft marked as `abandoned`
  8. **Fallback:** If Redis unavailable, use PostgreSQL row-level locks (slower but reliable)
- **Monitoring:**
  - Alert if lock contention rate > 5% (indicates undersupply or abuse)
  - Track lock acquisition failures (dashboard metric)
- **Deliverable:** 
  - `dev/services/booking-service/inventory-lock-manager.py`
  - `dev/services/booking-service/redis-lock-client.py`
  - `test-automation/integration-tests/inventory-locking.spec.ts`
- **Acceptance Criteria:**
  - Concurrent booking test (100 users, 1 room) → exactly 1 success, 99 failures
  - Lock renewal tested (user waits 12 minutes on payment page, lock extended)
  - Redis failure scenario tested (fallback to PostgreSQL locks)
- **Requirements Addressed:** REQ-028 (room selection), REQ-036 (booking cancellation)
- **Status:** Assigned to Backend Engineer (Sprint 3)

---

### DR-04: Real-Time Inventory Synchronization Strategy

**Issue:** Hotels may manage bookings across multiple channels (Booking.com, Expedia), leading to overbooking without PMS integration.

**Resolution (Sprint 2, TASK-018 + Sprint 7, TASK-042):**
- **V1 Approach (Sprint 2):** Manual Updates + Webhook API
  1. Hotels manually update availability via Hotel Manager Panel (REQ-048, REQ-049)
  2. Provide webhook API for hotels with PMS systems to push updates:
     - Endpoint: `POST /api/v1/hotels/{hotel_id}/inventory/webhook`
     - Payload: `{ room_type, date_range, available_count, updated_by: "PMS_NAME" }`
     - Authentication: API key per hotel
     - Documentation for common PMS providers (Opera, Maestro, Cloudbeds)
  3. Implement "on-request" booking status for high-risk bookings:
     - If hotel has <90% confirmation rate, booking status = `pending_confirmation`
     - Hotel must confirm within 24 hours via panel or API
     - If not confirmed, automatic cancellation with full refund + apology email
- **V2 Roadmap (Future):** Full PMS integration as highest priority post-MVP
- **Deliverable:**
  - `dev/services/hotel-service/webhook-receiver.py`
  - `dev/services/booking-service/on-request-workflow.py`
  - Documentation: `dev/docs/pms-integration-guide.md`
- **Acceptance Criteria:**
  - Webhook API tested with sample PMS payloads (Opera, Maestro)
  - On-request booking flow tested (hotel confirms/rejects within 24 hours)
  - Auto-cancellation triggered if no response after 24 hours
- **Requirements Addressed:** REQ-048 (manage inventory), REQ-049 (block dates)
- **Status:** Assigned to Backend Engineer (Sprint 2) + Frontend Engineer (Sprint 7 for UI)

---

## 2. Sprint Breakdown

### Sprint 0: Infrastructure & Foundations (Weeks 1-2)

**Goal:** Set up AWS infrastructure, CI/CD pipelines, and resolve P1 findings.

**Deliverables:**
- AWS environment (VPC, subnets, security groups, IAM roles)
- Terraform infrastructure-as-code for all resources
- CI/CD pipelines (GitHub Actions → ECS deployment)
- PostgreSQL database (RDS Multi-AZ), Redis cluster, Elasticsearch cluster
- S3 buckets with CloudFront CDN
- API Gateway (Kong) with rate limiting and authentication
- Monitoring (CloudWatch + DataDog dashboards)
- P1 findings resolution (data retention policy, Elasticsearch baseline test)

**Team Focus:**
- DevOps Engineer: Infrastructure setup
- Tech Lead: P1 findings resolution + architecture validation

---

### Sprint 1: Authentication & User Management (Weeks 3-4)

**Goal:** Implement Auth Service and User Service with JWT authentication.

**Deliverables:**
- Auth Service with email, phone, Google, Facebook login
- JWT token generation and validation (15-min access, 7-day refresh)
- Password recovery via email/SMS OTP
- User Service with profile management and saved payment methods
- Database schema for users, sessions, payment methods
- Unit tests (Jest) and integration tests (Playwright)

**Team Focus:**
- Backend Engineer 1: Auth Service
- Backend Engineer 2: User Service
- QA Engineer: Test automation framework setup

**Requirements Addressed:** REQ-001 to REQ-008, NFR-009

---

### Sprint 2: Hotel Service & Search (Weeks 5-6)

**Goal:** Implement Hotel Service for hotel listings and Search Service with Elasticsearch.

**Deliverables:**
- Hotel Service API (CRUD hotels, rooms, amenities)
- Search Service with Elasticsearch integration
- Geo-spatial search (map view), filters (price, rating, amenities)
- Hotel data indexing pipeline (PostgreSQL → SQS → Elasticsearch)
- Image upload to S3 with CloudFront delivery
- Webhook API for PMS integration (DR-04 resolution)
- Database schema for hotels, rooms, amenities

**Team Focus:**
- Backend Engineer 1: Hotel Service
- Backend Engineer 2: Search Service + Elasticsearch indexing
- DevOps Engineer: S3 + CloudFront setup

**Requirements Addressed:** REQ-009 to REQ-027, NFR-001, NFR-003

---

### Sprint 3: Booking & Payment (Weeks 7-8)

**Goal:** Implement Booking Service and Payment Service with Stripe/PayPal integration.

**Deliverables:**
- Booking Service with inventory locking (DR-03 resolution)
- Payment Service with Stripe and PayPal integration
- 3D Secure (3DS) for European cards
- Idempotency keys for payment deduplication
- Booking flow (draft → payment → confirmation)
- Cancellation and refund logic
- Database schema for bookings, payments, refunds

**Team Focus:**
- Backend Engineer 1: Booking Service + inventory locking
- Backend Engineer 2: Payment Service + Stripe/PayPal integration
- QA Engineer: Payment testing (sandbox environments)

**Requirements Addressed:** REQ-028 to REQ-037, REQ-040, NFR-002, NFR-007

---

### Sprint 4: Reviews & Notifications (Weeks 9-10)

**Goal:** Implement Review Service and Notification Service for post-booking features.

**Deliverables:**
- Review Service with rating/review submission and moderation
- Automated moderation (profanity filter, spam detection via AWS Comprehend)
- Notification Service with SendGrid (email), Twilio (SMS), FCM (push)
- Event-driven notifications via SQS/SNS
- Email templates for booking confirmation, cancellation, reminders
- Database schema for reviews, notifications

**Team Focus:**
- Backend Engineer 1: Review Service + automated moderation
- Backend Engineer 2: Notification Service + third-party integrations
- QA Engineer: Notification delivery testing

**Requirements Addressed:** REQ-024, REQ-025, REQ-043, REQ-035, NFR-016, NFR-017, NFR-018

---

### Sprint 5: Mobile App — Phase 1 (Weeks 11-12)

**Goal:** Build Flutter mobile app with authentication, search, and hotel details.

**Deliverables:**
- Flutter app scaffold with navigation (Material Design)
- Authentication screens (login, registration, social auth)
- Search screen with filters and sorting
- Hotel details screen with photo gallery, room listings, reviews
- Map view integration (Google Maps)
- API client with JWT token management
- Offline mode (view saved bookings with SQLite)

**Team Focus:**
- Mobile Engineer 1: Authentication + profile screens
- Mobile Engineer 2: Search + hotel details screens
- QA Engineer: Mobile UI testing

**Requirements Addressed:** REQ-001 to REQ-027, NFR-013, NFR-015, NFR-019, NFR-021

---

### Sprint 6: Mobile App — Phase 2 (Weeks 13-14)

**Goal:** Complete mobile app with booking, payment, and profile management.

**Deliverables:**
- Booking flow screens (room selection, guest details, payment)
- Payment integration (Stripe, PayPal, Google Pay, Apple Pay)
- Profile management screens (edit profile, saved payment methods)
- My Bookings screen (upcoming, past, cancellation)
- Review submission screen
- Push notification setup (Firebase Cloud Messaging)
- Add booking to calendar integration

**Team Focus:**
- Mobile Engineer 1: Booking flow + payment screens
- Mobile Engineer 2: Profile + My Bookings screens
- QA Engineer: End-to-end mobile testing

**Requirements Addressed:** REQ-028 to REQ-044, NFR-016

---

### Sprint 7: Web Admin Panels (Weeks 15-16)

**Goal:** Build React web panels for Hotel Manager and Super Admin.

**Deliverables:**
- Hotel Manager Panel:
  - Dashboard (upcoming bookings, occupancy, revenue)
  - Hotel profile management (photos, description, amenities)
  - Room inventory management (add/edit rooms, pricing)
  - Date blocking calendar
  - Booking management (confirm, cancel, check-in/out)
  - Earnings reports (CSV export)
  - Review response interface
- Super Admin Panel:
  - User management (activate/deactivate accounts)
  - Hotel listing approval workflow
  - Commission & payment settlement
  - Dispute handling interface
  - Promo code management
  - Platform analytics dashboard

**Team Focus:**
- Frontend Engineer 1: Hotel Manager Panel
- Frontend Engineer 2: Super Admin Panel
- QA Engineer: Web UI testing

**Requirements Addressed:** REQ-045 to REQ-061

---

### Sprint 8: Analytics & Reporting (Weeks 17-18)

**Goal:** Implement Analytics Service and advanced reporting features.

**Deliverables:**
- Analytics Service with read-only database access
- ETL pipeline (PostgreSQL → Redshift for historical analytics)
- Hotel Manager reports:
  - Revenue by month/quarter
  - Occupancy rate trends
  - Top-performing room types
  - Cancellation rate analysis
- Super Admin analytics:
  - Total bookings, revenue (platform-wide)
  - Top hotels by bookings/revenue
  - User growth metrics
  - Conversion funnel (search → booking)
  - Payment success/failure rates
- CSV/PDF export functionality

**Team Focus:**
- Backend Engineer 1: Analytics Service + ETL pipeline
- Frontend Engineer 1: Hotel Manager reports UI
- Frontend Engineer 2: Super Admin analytics dashboard

**Requirements Addressed:** REQ-053 (earnings reports), REQ-060 (platform analytics)

---

### Sprint 9: Integration Testing & Performance Tuning (Weeks 19-20)

**Goal:** End-to-end integration testing, bug fixes, and performance optimization.

**Deliverables:**
- Full end-to-end test suite (Playwright):
  - Customer booking flow (search → select → payment → confirmation)
  - Hotel manager workflow (add hotel → manage inventory → process booking)
  - Super admin workflow (approve hotel → settle payments → analytics)
- Load testing (k6 + Grafana):
  - Elasticsearch sizing validation (DR-02 resolution)
  - API response time validation (NFR-006: <500ms p95)
  - Database query optimization
  - Redis cache hit rate tuning
- Bug triage and fixes
- Performance profiling (Node.js memory leaks, database slow queries)

**Team Focus:**
- All Engineers: Bug fixes
- QA Engineer 1: E2E test automation
- QA Engineer 2: Load testing
- DevOps Engineer: Performance monitoring

**Requirements Addressed:** All NFRs validation

---

### Buffer Period: Hardening & Launch Prep (Weeks 21-26)

**Goal:** Load testing, security audit, beta launch, and production launch.

**Deliverables:**
- Week 21-22: **Load Testing**
  - Simulate 100K concurrent users (NFR-004)
  - Validate 99.9% uptime under load (NFR-011)
  - Stress test payment processing (NFR-002: <5s)
  - Elasticsearch cluster validation (NFR-001: <2s search)
- Week 22-23: **Security Audit**
  - Penetration testing by third-party firm
  - OWASP Top 10 vulnerability scanning
  - PCI DSS SAQ A validation
  - GDPR compliance review
- Week 24: **Beta Launch**
  - Invite 1,000 beta users
  - Monitor for critical bugs
  - Gather user feedback (usability, performance)
- Week 25: **Bug Fixes & Hardening**
  - Resolve beta findings
  - Final performance tuning
  - Disaster recovery drill
- Week 26: **Production Launch**
  - Go-live with full traffic
  - 24/7 on-call rotation
  - Monitor SLAs (uptime, latency, error rates)

**Team Focus:**
- All Engineers: On-call rotation
- QA Engineers: Beta testing coordination
- DevOps Engineer: Infrastructure scaling, DR drill

---

## 3. Task List (56 Tasks)

### Sprint 0: Infrastructure & Foundations

#### TASK-001: AWS Infrastructure Setup
- **Description:** Provision AWS resources using Terraform (VPC, subnets, security groups, IAM roles, NAT gateways)
- **Target Files:**
  - `dev/infrastructure/terraform/main.tf`
  - `dev/infrastructure/terraform/vpc.tf`
  - `dev/infrastructure/terraform/security-groups.tf`
  - `dev/infrastructure/terraform/iam.tf`
- **Depends On:** None
- **Satisfies:** NFR-005 (auto-scaling), NFR-008 (HTTPS/TLS), NFR-011 (99.9% uptime)
- **Sprint:** Sprint 0
- **DoD:**
  - VPC with 3 public and 3 private subnets across 3 AZs
  - Security groups configured with least-privilege rules
  - IAM roles for ECS tasks, Lambda, RDS access
  - Terraform state stored in S3 with locking (DynamoDB)
  - Infrastructure validated with `terraform plan` and `terraform apply`

---

#### TASK-002: Data Retention Policy Implementation
- **Description:** Implement GDPR-compliant data anonymization strategy (resolves DR-01)
- **Target Files:**
  - `dev/services/user-service/data-retention-handler.py`
  - `dev/services/user-service/anonymization-utils.py`
  - `dev/docs/privacy-policy-addendum.md`
- **Depends On:** TASK-001
- **Satisfies:** NFR-010 (GDPR/CCPA compliance)
- **Sprint:** Sprint 0
- **DoD:**
  - Anonymization script removes PII from booking/payment records
  - 30-day soft delete period implemented
  - Privacy policy updated and reviewed by legal counsel
  - Audit log confirms PII removal while retaining transaction records

---

#### TASK-003: Database Setup (PostgreSQL RDS)
- **Description:** Provision PostgreSQL RDS Multi-AZ with read replicas
- **Target Files:**
  - `dev/infrastructure/terraform/rds.tf`
  - `dev/database/migrations/001_initial_schema.sql`
  - `dev/database/seeds/dev_seed_data.sql`
- **Depends On:** TASK-001
- **Satisfies:** NFR-006 (database performance), NFR-011 (Multi-AZ failover), NFR-012 (disaster recovery)
- **Sprint:** Sprint 0
- **DoD:**
  - RDS instance (db.r6g.2xlarge) provisioned with Multi-AZ
  - 2 read replicas created in different AZs
  - Automated backups enabled (6-hour snapshots, 30-day retention)
  - PITR (Point-In-Time Recovery) enabled
  - Cross-region backups to us-west-2
  - PgBouncer connection pooling configured

---

#### TASK-004: Elasticsearch Cluster Setup & Baseline Testing
- **Description:** Provision 3-node Elasticsearch cluster and run baseline performance test (resolves DR-02 Phase 1)
- **Target Files:**
  - `dev/infrastructure/terraform/elasticsearch.tf`
  - `test-automation/load-tests/elasticsearch-baseline.spec.ts`
- **Depends On:** TASK-001
- **Satisfies:** NFR-001 (search performance <2s)
- **Sprint:** Sprint 0
- **DoD:**
  - 3-node Elasticsearch cluster (r6g.xlarge.search) provisioned
  - Sample dataset indexed (10K hotels, 100K bookings)
  - Load test with 1K concurrent users executed
  - Baseline metrics documented (p50, p95, p99 latency, CPU, heap usage)

---

#### TASK-005: Redis Cluster Setup
- **Description:** Provision Redis ElastiCache cluster with replication
- **Target Files:**
  - `dev/infrastructure/terraform/redis.tf`
- **Depends On:** TASK-001
- **Satisfies:** NFR-001 (caching), NFR-009 (session storage)
- **Sprint:** Sprint 0
- **DoD:**
  - 3-node Redis cluster (r6g.large) provisioned across 3 AZs
  - Cluster mode enabled with automatic failover
  - Connection pooling configured

---

#### TASK-006: S3 + CloudFront Setup
- **Description:** Create S3 buckets for images and configure CloudFront CDN
- **Target Files:**
  - `dev/infrastructure/terraform/s3.tf`
  - `dev/infrastructure/terraform/cloudfront.tf`
- **Depends On:** TASK-001
- **Satisfies:** REQ-020 (hotel photos), NFR-003 (image loading)
- **Sprint:** Sprint 0
- **DoD:**
  - S3 bucket created with versioning and lifecycle policies
  - CloudFront distribution configured with S3 origin
  - SSL certificate provisioned (Let's Encrypt via ACM)
  - Lambda@Edge function for image resizing (thumbnails)

---

#### TASK-007: API Gateway Setup (Kong)
- **Description:** Deploy Kong API Gateway with rate limiting and authentication plugins
- **Target Files:**
  - `dev/infrastructure/terraform/api-gateway.tf`
  - `dev/infrastructure/kong/kong.yml`
- **Depends On:** TASK-001
- **Satisfies:** NFR-008 (HTTPS/TLS), NFR-009 (JWT validation)
- **Sprint:** Sprint 0
- **DoD:**
  - Kong deployed on ECS Fargate (2 tasks, Multi-AZ)
  - Rate limiting plugin configured (1000 req/user/hour)
  - JWT validation plugin configured
  - CORS plugin configured
  - Application Load Balancer with TLS 1.3 termination

---

#### TASK-008: CI/CD Pipeline Setup
- **Description:** Create GitHub Actions workflows for automated testing and deployment
- **Target Files:**
  - `.github/workflows/backend-ci.yml`
  - `.github/workflows/mobile-ci.yml`
  - `.github/workflows/frontend-ci.yml`
  - `.github/workflows/deploy-to-ecs.yml`
- **Depends On:** TASK-001
- **Satisfies:** NFR-020 (maintainability)
- **Sprint:** Sprint 0
- **DoD:**
  - CI workflow runs on every PR (lint, unit tests, build)
  - CD workflow deploys to ECS on merge to `main` branch
  - Blue-green deployment strategy implemented
  - Rollback capability tested

---

#### TASK-009: Monitoring & Logging Setup
- **Description:** Configure CloudWatch and DataDog for monitoring and alerting
- **Target Files:**
  - `dev/infrastructure/terraform/cloudwatch.tf`
  - `dev/infrastructure/terraform/datadog.tf`
  - `dev/monitoring/dashboards/service-health.json`
- **Depends On:** TASK-001
- **Satisfies:** NFR-011 (uptime monitoring), NFR-020 (observability)
- **Sprint:** Sprint 0
- **DoD:**
  - CloudWatch Logs configured for all services (30-day retention)
  - DataDog APM configured with service tracing
  - Custom dashboards created (service health, API latency, database metrics)
  - Alerts configured for SLA breaches (>500ms p95, >1% error rate, <99.9% uptime)

---

### Sprint 1: Authentication & User Management

#### TASK-010: Database Schema — Users & Auth
- **Description:** Create database schema for users, sessions, and authentication
- **Target Files:**
  - `dev/database/migrations/002_users_auth_schema.sql`
  - `dev/database/models/user.py`
  - `dev/database/models/session.py`
- **Depends On:** TASK-003
- **Satisfies:** REQ-001, REQ-002
- **Sprint:** Sprint 1
- **DoD:**
  - Tables created: `users`, `sessions`, `oauth_providers`
  - Indexes created on `email`, `phone`, `social_id`
  - Foreign key constraints enforced
  - Schema validated with sample data

---

#### TASK-011: Auth Service — Email/Phone Registration
- **Description:** Implement user registration with email and phone number
- **Target Files:**
  - `dev/services/auth-service/app.py`
  - `dev/services/auth-service/routes/register.py`
  - `dev/services/auth-service/utils/password-hasher.py`
  - `dev/services/auth-service/utils/otp-sender.py`
- **Depends On:** TASK-010
- **Satisfies:** REQ-001, REQ-002
- **Sprint:** Sprint 1
- **DoD:**
  - `POST /api/v1/auth/register` endpoint implemented
  - Email verification via SendGrid
  - Phone verification via Twilio OTP
  - bcrypt password hashing (cost factor 12)
  - Rate limiting (5 registration attempts per IP per hour)
  - Unit tests (Jest) with 80%+ coverage

---

#### TASK-012: Auth Service — Social Authentication (Google, Facebook)
- **Description:** Implement OAuth 2.0 login with Google and Facebook
- **Target Files:**
  - `dev/services/auth-service/routes/social-auth.py`
  - `dev/services/auth-service/oauth/google-provider.py`
  - `dev/services/auth-service/oauth/facebook-provider.py`
- **Depends On:** TASK-011
- **Satisfies:** REQ-003, REQ-004, NFR-009
- **Sprint:** Sprint 1
- **DoD:**
  - `POST /api/v1/auth/social` endpoint implemented
  - Google OAuth 2.0 with PKCE
  - Facebook OAuth 2.0
  - User profile auto-populated from social provider
  - Unit tests with mocked OAuth responses

---

#### TASK-013: Auth Service — Login & JWT Token Generation
- **Description:** Implement login with JWT token generation and refresh
- **Target Files:**
  - `dev/services/auth-service/routes/login.py`
  - `dev/services/auth-service/utils/jwt-manager.py`
  - `dev/services/auth-service/middleware/auth-middleware.py`
- **Depends On:** TASK-011
- **Satisfies:** REQ-001, REQ-002, NFR-009
- **Sprint:** Sprint 1
- **DoD:**
  - `POST /api/v1/auth/login` endpoint implemented
  - JWT with RS256 algorithm (asymmetric keys)
  - 15-minute access token, 7-day refresh token
  - Token blacklist in Redis for logout
  - Rate limiting (5 failed login attempts → 15-min lockout)
  - Unit tests with token validation

---

#### TASK-014: Auth Service — Password Recovery
- **Description:** Implement password reset via email/phone OTP
- **Target Files:**
  - `dev/services/auth-service/routes/forgot-password.py`
  - `dev/services/auth-service/routes/reset-password.py`
- **Depends On:** TASK-013
- **Satisfies:** REQ-005
- **Sprint:** Sprint 1
- **DoD:**
  - `POST /api/v1/auth/forgot-password` sends OTP (email or SMS)
  - `POST /api/v1/auth/reset-password` validates OTP and updates password
  - OTP expires after 10 minutes
  - Rate limiting (3 attempts per user per hour)

---

#### TASK-015: User Service — Profile Management
- **Description:** Implement user profile CRUD operations
- **Target Files:**
  - `dev/services/user-service/app.py`
  - `dev/services/user-service/routes/profile.py`
  - `dev/database/migrations/003_user_profiles_schema.sql`
- **Depends On:** TASK-010
- **Satisfies:** REQ-006
- **Sprint:** Sprint 1
- **DoD:**
  - `GET /api/v1/users/:id` retrieves profile
  - `PUT /api/v1/users/:id` updates profile
  - Profile picture upload to S3
  - PII encrypted at rest (AES-256)
  - Unit tests with profile update scenarios

---

#### TASK-016: User Service — Saved Payment Methods
- **Description:** Implement tokenized payment method storage (Stripe/PayPal)
- **Target Files:**
  - `dev/services/user-service/routes/payment-methods.py`
  - `dev/services/user-service/utils/stripe-tokenizer.py`
  - `dev/database/migrations/004_payment_methods_schema.sql`
- **Depends On:** TASK-015
- **Satisfies:** REQ-007, NFR-007 (PCI DSS)
- **Sprint:** Sprint 1
- **DoD:**
  - `POST /api/v1/users/:id/payment-methods` tokenizes and saves method
  - `GET /api/v1/users/:id/payment-methods` lists saved methods
  - `DELETE /api/v1/users/:id/payment-methods/:pmId` removes method
  - No full card numbers stored (only Stripe/PayPal tokens)
  - Last 4 digits and card type saved for display

---

#### TASK-017: User Service — Booking History
- **Description:** Implement booking history retrieval
- **Target Files:**
  - `dev/services/user-service/routes/booking-history.py`
- **Depends On:** TASK-015
- **Satisfies:** REQ-008, REQ-038, REQ-039
- **Sprint:** Sprint 1
- **DoD:**
  - `GET /api/v1/users/:id/bookings` returns upcoming and past bookings
  - Pagination implemented (20 bookings per page)
  - Filter by status (upcoming, completed, cancelled)
  - Unit tests with sample booking data

---

### Sprint 2: Hotel Service & Search

#### TASK-018: Database Schema — Hotels, Rooms, Amenities
- **Description:** Create database schema for hotels, rooms, and amenities
- **Target Files:**
  - `dev/database/migrations/005_hotels_schema.sql`
  - `dev/database/models/hotel.py`
  - `dev/database/models/room.py`
  - `dev/database/models/amenity.py`
- **Depends On:** TASK-003
- **Satisfies:** REQ-020, REQ-021, REQ-022, REQ-023
- **Sprint:** Sprint 2
- **DoD:**
  - Tables created: `hotels`, `rooms`, `amenities`, `hotel_amenities`
  - Indexes on `location` (PostGIS), `star_rating`, `price`
  - Foreign key constraints enforced
  - Sample data seeded (100 hotels)

---

#### TASK-019: Hotel Service — CRUD Operations
- **Description:** Implement hotel listing management (create, read, update, delete)
- **Target Files:**
  - `dev/services/hotel-service/app.py`
  - `dev/services/hotel-service/routes/hotels.py`
  - `dev/services/hotel-service/routes/rooms.py`
- **Depends On:** TASK-018
- **Satisfies:** REQ-047 (manage hotel profile), REQ-048 (manage inventory)
- **Sprint:** Sprint 2
- **DoD:**
  - `POST /api/v1/hotels` creates hotel (Super Admin only)
  - `GET /api/v1/hotels/:id` retrieves hotel details
  - `PUT /api/v1/hotels/:id` updates hotel (Hotel Manager only)
  - `DELETE /api/v1/hotels/:id` soft deletes hotel (Super Admin only)
  - `POST /api/v1/hotels/:id/rooms` creates room type
  - `PUT /api/v1/hotels/:id/rooms/:roomId` updates room pricing
  - Image upload to S3 with CloudFront URL storage

---

#### TASK-020: Hotel Service — PMS Webhook API (DR-04 Resolution)
- **Description:** Implement webhook API for PMS systems to push inventory updates
- **Target Files:**
  - `dev/services/hotel-service/routes/webhook.py`
  - `dev/services/hotel-service/auth/webhook-auth.py`
  - `dev/docs/pms-integration-guide.md`
- **Depends On:** TASK-019
- **Satisfies:** REQ-048 (manage inventory)
- **Sprint:** Sprint 2
- **DoD:**
  - `POST /api/v1/hotels/:id/inventory/webhook` endpoint implemented
  - API key authentication per hotel
  - Validate payload schema (room type, date range, available count)
  - Documentation for Opera, Maestro, Cloudbeds PMS systems
  - Unit tests with sample PMS payloads

---

#### TASK-021: Elasticsearch Indexing Pipeline
- **Description:** Implement hotel data indexing from PostgreSQL to Elasticsearch via SQS
- **Target Files:**
  - `dev/services/hotel-service/events/hotel-updated-publisher.py`
  - `dev/workers/search-indexer/index-worker.py`
  - `dev/elasticsearch/mappings/hotel-mapping.json`
- **Depends On:** TASK-004, TASK-019
- **Satisfies:** REQ-009 (hotel search), NFR-001 (search performance)
- **Sprint:** Sprint 2
- **DoD:**
  - Hotel create/update triggers SQS event
  - Search indexer worker consumes event and updates Elasticsearch
  - Geo-spatial mapping configured (location field)
  - Full-text search on hotel name, description, city
  - Indexing lag < 1 minute (p95)

---

#### TASK-022: Search Service — Basic Search & Filters
- **Description:** Implement hotel search with destination, dates, guests, and filters
- **Target Files:**
  - `dev/services/search-service/app.py`
  - `dev/services/search-service/routes/search.py`
  - `dev/services/search-service/query-builder.py`
- **Depends On:** TASK-021
- **Satisfies:** REQ-009 to REQ-014 (search, filters)
- **Sprint:** Sprint 2
- **DoD:**
  - `GET /api/v1/search` endpoint implemented
  - Query parameters: destination, check_in, check_out, guests, rooms
  - Filters: price (min/max), star rating, amenities, property type, cancellation policy
  - Redis caching (5-min TTL)
  - Response time < 2s (p95)
  - Pagination (20 results per page)

---

#### TASK-023: Search Service — Sorting & Map View
- **Description:** Implement sorting (price, rating, popularity) and geo-spatial map view
- **Target Files:**
  - `dev/services/search-service/routes/search.py` (extend)
  - `dev/services/search-service/geo-query-builder.py`
- **Depends On:** TASK-022
- **Satisfies:** REQ-015 to REQ-019 (sorting, map view)
- **Sprint:** Sprint 2
- **DoD:**
  - Sort by: price (low-to-high, high-to-low), rating, popularity, distance
  - `GET /api/v1/search/map` returns hotels within bounding box
  - Geo-distance sorting from user location
  - Google Maps API integration for geocoding
  - Unit tests with sample search queries

---

### Sprint 3: Booking & Payment

#### TASK-024: Database Schema — Bookings & Payments
- **Description:** Create database schema for bookings, payments, and refunds
- **Target Files:**
  - `dev/database/migrations/006_bookings_schema.sql`
  - `dev/database/models/booking.py`
  - `dev/database/models/payment.py`
  - `dev/database/models/refund.py`
- **Depends On:** TASK-003
- **Satisfies:** REQ-028, REQ-032
- **Sprint:** Sprint 3
- **DoD:**
  - Tables created: `bookings`, `payments`, `refunds`
  - Status fields: `draft`, `pending_payment`, `confirmed`, `cancelled`, `pending_confirmation`
  - Indexes on `user_id`, `hotel_id`, `check_in_date`, `status`
  - Foreign key constraints to `users`, `hotels`, `rooms`

---

#### TASK-025: Booking Service — Inventory Locking (DR-03 Resolution)
- **Description:** Implement distributed locking with Redis RedLock to prevent double-booking
- **Target Files:**
  - `dev/services/booking-service/utils/inventory-lock-manager.py`
  - `dev/services/booking-service/utils/redis-lock-client.py`
- **Depends On:** TASK-005, TASK-024
- **Satisfies:** REQ-028 (room selection)
- **Sprint:** Sprint 3
- **DoD:**
  - Redis RedLock implementation with 10-min TTL
  - Lock key format: `lock:hotel:{hotel_id}:room:{room_type}:date:{date_range}`
  - Lock renewal mechanism (extend by 5 min if user active)
  - Fallback to PostgreSQL row-level locks if Redis unavailable
  - Concurrent booking test (100 users, 1 room) → exactly 1 success
  - Lock contention monitoring (alert if >5%)

---

#### TASK-026: Booking Service — Create Booking Draft
- **Description:** Implement booking draft creation with inventory check
- **Target Files:**
  - `dev/services/booking-service/app.py`
  - `dev/services/booking-service/routes/bookings.py`
  - `dev/services/booking-service/services/availability-checker.py`
- **Depends On:** TASK-025
- **Satisfies:** REQ-028 (room selection), REQ-029 (special requests)
- **Sprint:** Sprint 3
- **DoD:**
  - `POST /api/v1/bookings` creates booking draft with status `draft`
  - Real-time availability check from Hotel Service (source of truth)
  - Acquire Redis lock before creating draft
  - If lock acquisition fails, return 409 Conflict
  - Special requests captured in booking record
  - Price breakdown calculation (base price + taxes + fees)

---

#### TASK-027: Payment Service — Stripe Integration
- **Description:** Implement Stripe payment processing with 3D Secure
- **Target Files:**
  - `dev/services/payment-service/app.py`
  - `dev/services/payment-service/routes/payments.py`
  - `dev/services/payment-service/providers/stripe-client.py`
- **Depends On:** TASK-024
- **Satisfies:** REQ-032 (credit/debit card payment), NFR-007 (PCI DSS)
- **Sprint:** Sprint 3
- **DoD:**
  - `POST /api/v1/payments/process` charges card via Stripe
  - Idempotency key required (prevent duplicate charges)
  - 3D Secure (3DS) enforced for European cards
  - Stripe Radar fraud detection enabled
  - Webhook handler for async payment status updates
  - Unit tests with Stripe test cards

---

#### TASK-028: Payment Service — PayPal & Digital Wallets
- **Description:** Implement PayPal, Google Pay, Apple Pay payment methods
- **Target Files:**
  - `dev/services/payment-service/providers/paypal-client.py`
  - `dev/services/payment-service/providers/digital-wallet-handler.py`
- **Depends On:** TASK-027
- **Satisfies:** REQ-033 (digital wallet payment)
- **Sprint:** Sprint 3
- **DoD:**
  - PayPal integration with Express Checkout
  - Google Pay integration (Web Payments API)
  - Apple Pay integration (PassKit)
  - Fallback to Stripe if PayPal unavailable
  - Unit tests with sandbox environments

---

#### TASK-029: Booking Service — Booking Confirmation Workflow
- **Description:** Implement booking confirmation after successful payment
- **Target Files:**
  - `dev/services/booking-service/routes/bookings.py` (extend)
  - `dev/services/booking-service/services/confirmation-handler.py`
- **Depends On:** TASK-026, TASK-027
- **Satisfies:** REQ-035 (booking confirmation)
- **Sprint:** Sprint 3
- **DoD:**
  - On payment success, update booking status to `confirmed`
  - Atomically decrement room inventory in PostgreSQL
  - Release Redis lock
  - Publish `booking_confirmed` event to SQS (triggers notification)
  - Generate unique booking ID
  - Integration test: full booking flow (draft → payment → confirmed)

---

#### TASK-030: Booking Service — Cancellation & Refund Logic
- **Description:** Implement booking cancellation with refund calculation per cancellation policy
- **Target Files:**
  - `dev/services/booking-service/routes/cancellations.py`
  - `dev/services/booking-service/services/refund-calculator.py`
- **Depends On:** TASK-029
- **Satisfies:** REQ-036 (booking cancellation), REQ-040 (cancel with refund)
- **Sprint:** Sprint 3
- **DoD:**
  - `POST /api/v1/bookings/:id/cancel` cancels booking
  - Refund amount calculated per hotel's cancellation policy
  - Update booking status to `cancelled`
  - Restore room inventory (increment available count)
  - Trigger refund via Payment Service (Stripe/PayPal refund API)
  - Publish `booking_cancelled` event to SQS (triggers notification)

---

#### TASK-031: Booking Service — Promo Code Application
- **Description:** Implement promo code validation and discount application
- **Target Files:**
  - `dev/services/booking-service/routes/promo-codes.py`
  - `dev/database/migrations/007_promo_codes_schema.sql`
- **Depends On:** TASK-026
- **Satisfies:** REQ-031 (promo/discount code)
- **Sprint:** Sprint 3
- **DoD:**
  - `POST /api/v1/bookings/:id/apply-promo` validates and applies code
  - Promo code types: percentage discount, fixed amount discount
  - Validate expiry date, usage limit, minimum booking amount
  - Update booking price breakdown
  - Unit tests with expired/invalid codes

---

### Sprint 4: Reviews & Notifications

#### TASK-032: Database Schema — Reviews
- **Description:** Create database schema for reviews and ratings
- **Target Files:**
  - `dev/database/migrations/008_reviews_schema.sql`
  - `dev/database/models/review.py`
- **Depends On:** TASK-003
- **Satisfies:** REQ-024, REQ-043
- **Sprint:** Sprint 4
- **DoD:**
  - Table created: `reviews`
  - Fields: `booking_id`, `user_id`, `hotel_id`, `rating` (1-5), `review_text`, `status` (pending, approved, rejected)
  - Indexes on `hotel_id`, `status`, `created_at`
  - Foreign key constraints to `bookings`, `users`, `hotels`

---

#### TASK-033: Review Service — Submit Review
- **Description:** Implement review submission with automated moderation
- **Target Files:**
  - `dev/services/review-service/app.py`
  - `dev/services/review-service/routes/reviews.py`
  - `dev/services/review-service/moderation/profanity-filter.py`
  - `dev/services/review-service/moderation/spam-detector.py`
- **Depends On:** TASK-032
- **Satisfies:** REQ-043 (rate & review hotel)
- **Sprint:** Sprint 4
- **DoD:**
  - `POST /api/v1/reviews` submits review (requires completed booking)
  - Automated moderation pipeline:
    1. Profanity filter (reject if offensive language detected)
    2. Spam detection via AWS Comprehend (flag suspicious reviews)
    3. Auto-approve if passes checks, else queue for manual review
  - Unit tests with offensive/spam content

---

#### TASK-034: Review Service — Display Reviews
- **Description:** Implement review retrieval with sorting and pagination
- **Target Files:**
  - `dev/services/review-service/routes/reviews.py` (extend)
- **Depends On:** TASK-033
- **Satisfies:** REQ-024 (user reviews), REQ-025 (review sorting)
- **Sprint:** Sprint 4
- **DoD:**
  - `GET /api/v1/hotels/:id/reviews` returns approved reviews
  - Sort by: date (newest first), rating (high/low)
  - Pagination (20 reviews per page)
  - Filter by rating (e.g., only 5-star reviews)
  - Redis caching (1-hour TTL)

---

#### TASK-035: Review Service — Hotel Manager Response
- **Description:** Implement review response feature for hotel managers
- **Target Files:**
  - `dev/services/review-service/routes/review-responses.py`
- **Depends On:** TASK-034
- **Satisfies:** REQ-052 (respond to reviews)
- **Sprint:** Sprint 4
- **DoD:**
  - `POST /api/v1/reviews/:id/response` adds hotel manager response
  - Authorization: only hotel manager can respond to reviews for their hotel
  - Response displayed under review
  - Notification sent to reviewer (email)

---

#### TASK-036: Notification Service — Email Integration (SendGrid)
- **Description:** Implement email notification sending via SendGrid
- **Target Files:**
  - `dev/services/notification-service/app.py`
  - `dev/services/notification-service/providers/sendgrid-client.py`
  - `dev/services/notification-service/templates/booking-confirmation.html`
  - `dev/services/notification-service/templates/booking-cancellation.html`
- **Depends On:** TASK-001
- **Satisfies:** REQ-035 (booking confirmation), NFR-017 (email delivery)
- **Sprint:** Sprint 4
- **DoD:**
  - Email templates created (booking confirmation, cancellation, password reset)
  - SendGrid API integration
  - SQS queue consumer for `email_notification` events
  - Webhook handler for delivery tracking (opens, clicks, bounces)
  - Fallback to AWS SES if SendGrid unavailable
  - Retry logic with exponential backoff

---

#### TASK-037: Notification Service — SMS Integration (Twilio)
- **Description:** Implement SMS notification sending via Twilio
- **Target Files:**
  - `dev/services/notification-service/providers/twilio-client.py`
- **Depends On:** TASK-036
- **Satisfies:** REQ-035 (booking confirmation), NFR-018 (SMS delivery)
- **Sprint:** Sprint 4
- **DoD:**
  - Twilio API integration
  - SQS queue consumer for `sms_notification` events
  - Delivery receipt tracking
  - Fallback to email if SMS fails
  - Retry logic (3 attempts)

---

#### TASK-038: Notification Service — Push Notifications (FCM)
- **Description:** Implement push notification sending via Firebase Cloud Messaging
- **Target Files:**
  - `dev/services/notification-service/providers/fcm-client.py`
- **Depends On:** TASK-036
- **Satisfies:** REQ-035 (booking confirmation), NFR-016 (push notifications)
- **Sprint:** Sprint 4
- **DoD:**
  - Firebase Cloud Messaging integration
  - SQS queue consumer for `push_notification` events
  - Topic-based messaging (all users, specific user)
  - User notification preferences respected (opt-out support)
  - Retry logic (3 attempts)

---

#### TASK-039: Notification Service — Booking Event Handlers
- **Description:** Implement event handlers for booking lifecycle events
- **Target Files:**
  - `dev/services/notification-service/handlers/booking-confirmed-handler.py`
  - `dev/services/notification-service/handlers/booking-cancelled-handler.py`
  - `dev/services/notification-service/handlers/booking-reminder-handler.py`
- **Depends On:** TASK-036, TASK-037, TASK-038
- **Satisfies:** REQ-035 (multi-channel confirmation)
- **Sprint:** Sprint 4
- **DoD:**
  - Booking confirmed → send email, SMS, push notification
  - Booking cancelled → send cancellation confirmation
  - Booking reminder → send 24 hours before check-in
  - All notifications include booking details (hotel name, dates, confirmation ID)

---

### Sprint 5: Mobile App — Phase 1

#### TASK-040: Flutter App Scaffold
- **Description:** Set up Flutter project structure with navigation and state management
- **Target Files:**
  - `dev/mobile-app/pubspec.yaml`
  - `dev/mobile-app/lib/main.dart`
  - `dev/mobile-app/lib/routes/app-routes.dart`
  - `dev/mobile-app/lib/providers/auth-provider.dart`
- **Depends On:** None (parallel with backend)
- **Satisfies:** NFR-015 (responsive design), NFR-021 (iOS 14+, Android 8.0+)
- **Sprint:** Sprint 5
- **DoD:**
  - Flutter 3.x project created
  - Material Design theme configured
  - Navigation setup (GoRouter or Navigator 2.0)
  - Riverpod state management configured
  - Folder structure: `lib/screens`, `lib/widgets`, `lib/services`, `lib/models`, `lib/providers`

---

#### TASK-041: Mobile App — Authentication Screens
- **Description:** Implement login, registration, and social auth screens
- **Target Files:**
  - `dev/mobile-app/lib/screens/auth/login-screen.dart`
  - `dev/mobile-app/lib/screens/auth/register-screen.dart`
  - `dev/mobile-app/lib/services/auth-service.dart`
  - `dev/mobile-app/lib/utils/jwt-storage.dart`
- **Depends On:** TASK-040, TASK-013 (Auth Service API)
- **Satisfies:** REQ-001 to REQ-005
- **Sprint:** Sprint 5
- **DoD:**
  - Login screen (email/phone + password)
  - Registration screen (email/phone + password + confirmation)
  - Social auth buttons (Google, Facebook)
  - JWT token stored in Flutter Secure Storage
  - Token refresh logic implemented
  - Form validation (email format, password strength)
  - UI tests (widget tests)

---

#### TASK-042: Mobile App — Profile Management
- **Description:** Implement user profile screen with edit functionality
- **Target Files:**
  - `dev/mobile-app/lib/screens/profile/profile-screen.dart`
  - `dev/mobile-app/lib/screens/profile/edit-profile-screen.dart`
  - `dev/mobile-app/lib/services/user-service.dart`
- **Depends On:** TASK-041, TASK-015 (User Service API)
- **Satisfies:** REQ-006 (profile management)
- **Sprint:** Sprint 5
- **DoD:**
  - Profile screen displays user info (name, email, phone, profile picture)
  - Edit profile screen (update name, phone, profile picture)
  - Profile picture upload to S3
  - Image picker for profile picture
  - UI tests

---

#### TASK-043: Mobile App — Hotel Search Screen
- **Description:** Implement search screen with destination, dates, guests inputs
- **Target Files:**
  - `dev/mobile-app/lib/screens/search/search-screen.dart`
  - `dev/mobile-app/lib/screens/search/search-results-screen.dart`
  - `dev/mobile-app/lib/services/search-service.dart`
- **Depends On:** TASK-040, TASK-022 (Search Service API)
- **Satisfies:** REQ-009 (hotel search), REQ-010 to REQ-014 (filters)
- **Sprint:** Sprint 5
- **DoD:**
  - Search form (destination autocomplete, date picker, guest/room selectors)
  - Search results list with pagination
  - Filters panel (price, rating, amenities, property type)
  - Sort dropdown (price, rating, popularity)
  - Shimmer loading effect
  - UI tests

---

#### TASK-044: Mobile App — Hotel Details Screen
- **Description:** Implement hotel details screen with photo gallery, rooms, reviews
- **Target Files:**
  - `dev/mobile-app/lib/screens/hotel/hotel-details-screen.dart`
  - `dev/mobile-app/lib/widgets/photo-gallery.dart`
  - `dev/mobile-app/lib/widgets/room-card.dart`
- **Depends On:** TASK-040, TASK-019 (Hotel Service API)
- **Satisfies:** REQ-020 to REQ-027
- **Sprint:** Sprint 5
- **DoD:**
  - Photo gallery with swipeable carousel
  - Hotel description and highlights
  - Room listings with pricing and availability
  - Amenities list with icons
  - Reviews section with ratings
  - Cancellation policy display
  - Check-in/out timings
  - "Book Now" button navigates to booking flow
  - UI tests

---

#### TASK-045: Mobile App — Map View
- **Description:** Implement map view with hotel pins and prices
- **Target Files:**
  - `dev/mobile-app/lib/screens/search/map-view-screen.dart`
  - `dev/mobile-app/lib/widgets/hotel-map-marker.dart`
- **Depends On:** TASK-043, TASK-023 (Search Service map API)
- **Satisfies:** REQ-019 (map view)
- **Sprint:** Sprint 5
- **DoD:**
  - Google Maps integration (google_maps_flutter package)
  - Hotel markers with price labels
  - Tap marker to show hotel preview card
  - "List View" / "Map View" toggle button
  - Current location marker
  - UI tests

---

### Sprint 6: Mobile App — Phase 2

#### TASK-046: Mobile App — Booking Flow (Room Selection)
- **Description:** Implement room selection and guest details screens
- **Target Files:**
  - `dev/mobile-app/lib/screens/booking/room-selection-screen.dart`
  - `dev/mobile-app/lib/screens/booking/guest-details-screen.dart`
- **Depends On:** TASK-044, TASK-026 (Booking Service API)
- **Satisfies:** REQ-028 (room selection), REQ-029 (special requests)
- **Sprint:** Sprint 6
- **DoD:**
  - Room selection screen with quantity picker
  - Guest details form (name, email, phone per guest)
  - Special requests text area
  - Price breakdown (base price, taxes, fees)
  - "Continue to Payment" button
  - Form validation
  - UI tests

---

#### TASK-047: Mobile App — Payment Screen
- **Description:** Implement payment screen with Stripe, PayPal, digital wallets
- **Target Files:**
  - `dev/mobile-app/lib/screens/booking/payment-screen.dart`
  - `dev/mobile-app/lib/services/payment-service.dart`
  - `dev/mobile-app/lib/widgets/payment-method-selector.dart`
- **Depends On:** TASK-046, TASK-027, TASK-028 (Payment Service API)
- **Satisfies:** REQ-032 (card payment), REQ-033 (digital wallets), REQ-031 (promo code)
- **Sprint:** Sprint 6
- **DoD:**
  - Payment method selector (credit card, PayPal, Google Pay, Apple Pay)
  - Stripe card input widget (stripe_flutter package)
  - PayPal checkout integration
  - Google Pay / Apple Pay buttons (conditional on platform)
  - Promo code input field with validation
  - "Pay Now" button with loading state
  - 3D Secure handling
  - UI tests

---

#### TASK-048: Mobile App — Booking Confirmation Screen
- **Description:** Implement booking confirmation screen after successful payment
- **Target Files:**
  - `dev/mobile-app/lib/screens/booking/confirmation-screen.dart`
  - `dev/mobile-app/lib/widgets/booking-confirmation-card.dart`
- **Depends On:** TASK-047, TASK-029 (Booking confirmation API)
- **Satisfies:** REQ-035 (booking confirmation), REQ-044 (add to calendar)
- **Sprint:** Sprint 6
- **DoD:**
  - Success animation (Lottie or confetti)
  - Booking details card (confirmation ID, hotel, dates, guests)
  - "Add to Calendar" button (exports .ics file)
  - "View Booking" button navigates to My Bookings
  - UI tests

---

#### TASK-049: Mobile App — My Bookings Screen
- **Description:** Implement bookings list with upcoming and past bookings
- **Target Files:**
  - `dev/mobile-app/lib/screens/bookings/my-bookings-screen.dart`
  - `dev/mobile-app/lib/screens/bookings/booking-details-screen.dart`
- **Depends On:** TASK-042, TASK-017 (User Service booking history API)
- **Satisfies:** REQ-038 (upcoming bookings), REQ-039 (past bookings)
- **Sprint:** Sprint 6
- **DoD:**
  - Bookings list with tabs (Upcoming, Past)
  - Booking card displays hotel name, dates, status
  - Tap card to view booking details
  - Booking details screen with full info
  - "Cancel Booking" button (if cancellable)
  - "Contact Hotel" button
  - UI tests

---

#### TASK-050: Mobile App — Booking Cancellation
- **Description:** Implement booking cancellation flow with refund calculation
- **Target Files:**
  - `dev/mobile-app/lib/screens/bookings/cancel-booking-screen.dart`
  - `dev/mobile-app/lib/services/booking-service.dart`
- **Depends On:** TASK-049, TASK-030 (Cancellation API)
- **Satisfies:** REQ-040 (cancel booking with refund)
- **Sprint:** Sprint 6
- **DoD:**
  - Cancellation confirmation dialog
  - Refund amount displayed
  - Cancellation policy displayed
  - "Confirm Cancellation" button
  - Success message after cancellation
  - Booking status updated to "Cancelled"
  - UI tests

---

#### TASK-051: Mobile App — Review Submission
- **Description:** Implement review submission screen after completed stay
- **Target Files:**
  - `dev/mobile-app/lib/screens/reviews/submit-review-screen.dart`
- **Depends On:** TASK-049, TASK-033 (Review Service API)
- **Satisfies:** REQ-043 (rate & review hotel)
- **Sprint:** Sprint 6
- **DoD:**
  - Star rating input (1-5 stars)
  - Review text area
  - "Submit Review" button
  - Success message
  - Review appears on hotel details page after approval
  - UI tests

---

#### TASK-052: Mobile App — Push Notifications & Offline Mode
- **Description:** Implement push notifications and offline booking viewing
- **Target Files:**
  - `dev/mobile-app/lib/services/notification-service.dart`
  - `dev/mobile-app/lib/services/offline-storage.dart`
- **Depends On:** TASK-040, TASK-038 (FCM API)
- **Satisfies:** NFR-016 (push notifications), NFR-019 (offline capability)
- **Sprint:** Sprint 6
- **DoD:**
  - Firebase Cloud Messaging integration
  - Push notification permissions requested
  - Notification tapped → navigate to relevant screen
  - SQLite local database for offline bookings
  - Bookings synced to local storage after fetch
  - Offline banner displayed when no internet
  - UI tests

---

### Sprint 7: Web Admin Panels

#### TASK-053: Hotel Manager Panel — Dashboard
- **Description:** Implement dashboard with bookings, occupancy, revenue
- **Target Files:**
  - `dev/web-admin/hotel-manager/src/pages/Dashboard.tsx`
  - `dev/web-admin/hotel-manager/src/components/BookingsTable.tsx`
  - `dev/web-admin/hotel-manager/src/components/OccupancyChart.tsx`
- **Depends On:** TASK-029 (Booking API)
- **Satisfies:** REQ-046 (dashboard overview)
- **Sprint:** Sprint 7
- **DoD:**
  - Dashboard displays upcoming bookings (7 days)
  - Occupancy rate chart (current month)
  - Revenue summary (current month)
  - Key metrics cards (total bookings, avg rating, revenue)
  - Responsive design (Material-UI Grid)
  - E2E tests (Playwright)

---

#### TASK-054: Hotel Manager Panel — Hotel Profile Management
- **Description:** Implement hotel profile edit with photos, description, amenities
- **Target Files:**
  - `dev/web-admin/hotel-manager/src/pages/HotelProfile.tsx`
  - `dev/web-admin/hotel-manager/src/components/PhotoUploader.tsx`
  - `dev/web-admin/hotel-manager/src/components/AmenitiesSelector.tsx`
- **Depends On:** TASK-019 (Hotel Service API)
- **Satisfies:** REQ-047 (manage hotel profile)
- **Sprint:** Sprint 7
- **DoD:**
  - Hotel profile form (name, description, star rating, policies)
  - Photo uploader (drag-and-drop, multiple uploads to S3)
  - Amenities multi-select checkboxes
  - "Save Changes" button
  - Success/error toast notifications
  - E2E tests

---

#### TASK-055: Hotel Manager Panel — Room Inventory Management
- **Description:** Implement room type management with pricing
- **Target Files:**
  - `dev/web-admin/hotel-manager/src/pages/RoomInventory.tsx`
  - `dev/web-admin/hotel-manager/src/components/RoomForm.tsx`
- **Depends On:** TASK-019 (Hotel Service API)
- **Satisfies:** REQ-048 (manage inventory)
- **Sprint:** Sprint 7
- **DoD:**
  - Room types list (Standard, Deluxe, Suite)
  - "Add Room Type" button → form modal
  - Room form (name, price, max guests, quantity)
  - Edit/delete room type
  - E2E tests

---

#### TASK-056: Hotel Manager Panel — Date Blocking Calendar
- **Description:** Implement calendar for blocking unavailable dates
- **Target Files:**
  - `dev/web-admin/hotel-manager/src/pages/DateBlocking.tsx`
  - `dev/web-admin/hotel-manager/src/components/BlockingCalendar.tsx`
- **Depends On:** TASK-019 (Hotel Service API)
- **Satisfies:** REQ-049 (block dates)
- **Sprint:** Sprint 7
- **DoD:**
  - Calendar view (react-big-calendar or FullCalendar)
  - Select date range to block
  - Block reason input (maintenance, fully booked)
  - Blocked dates displayed in red
  - Unblock dates functionality
  - E2E tests

---

#### TASK-057: Super Admin Panel — User Management
- **Description:** Implement user management with account activation/deactivation
- **Target Files:**
  - `dev/web-admin/super-admin/src/pages/UserManagement.tsx`
  - `dev/web-admin/super-admin/src/components/UserTable.tsx`
- **Depends On:** TASK-015 (User Service API)
- **Satisfies:** REQ-054 (user management)
- **Sprint:** Sprint 7
- **DoD:**
  - User list with search and filters (role, status)
  - Activate/deactivate account button
  - View user details modal
  - Pagination (50 users per page)
  - E2E tests

---

#### TASK-058: Super Admin Panel — Hotel Approval Workflow
- **Description:** Implement hotel listing approval interface
- **Target Files:**
  - `dev/web-admin/super-admin/src/pages/HotelApprovals.tsx`
  - `dev/web-admin/super-admin/src/components/HotelReviewCard.tsx`
- **Depends On:** TASK-019 (Hotel Service API)
- **Satisfies:** REQ-055 (hotel listing approval), REQ-056 (hotel verification)
- **Sprint:** Sprint 7
- **DoD:**
  - Pending approvals list
  - Hotel details review (photos, description, amenities)
  - Approve/Reject buttons with reason input
  - Verification badge toggle
  - E2E tests

---

#### TASK-059: Super Admin Panel — Commission & Payment Settlement
- **Description:** Implement payment settlement interface for hotels
- **Target Files:**
  - `dev/web-admin/super-admin/src/pages/PaymentSettlements.tsx`
  - `dev/services/analytics-service/routes/settlements.py`
- **Depends On:** TASK-024 (Payments schema)
- **Satisfies:** REQ-057 (commission & settlement)
- **Sprint:** Sprint 7
- **DoD:**
  - Settlement list (pending, completed)
  - Commission calculation (10% of booking amount)
  - "Initiate Payment" button (marks as pending)
  - Settlement details view
  - E2E tests

---

#### TASK-060: Super Admin Panel — Dispute Handling
- **Description:** Implement dispute management interface
- **Target Files:**
  - `dev/web-admin/super-admin/src/pages/Disputes.tsx`
  - `dev/database/migrations/009_disputes_schema.sql`
  - `dev/services/booking-service/routes/disputes.py`
- **Depends On:** TASK-024 (Bookings schema)
- **Satisfies:** REQ-058 (dispute handling)
- **Sprint:** Sprint 7
- **DoD:**
  - Dispute list with filters (open, resolved)
  - Dispute details view (customer + hotel perspective)
  - Admin actions (refund, penalty, close)
  - Notes/comments section
  - E2E tests

---

#### TASK-061: Super Admin Panel — Promo Code Management
- **Description:** Implement promo code creation and management
- **Target Files:**
  - `dev/web-admin/super-admin/src/pages/PromoCodes.tsx`
  - `dev/services/booking-service/routes/promo-codes-admin.py`
- **Depends On:** TASK-031 (Promo codes schema)
- **Satisfies:** REQ-059 (manage promo codes)
- **Sprint:** Sprint 7
- **DoD:**
  - Promo code list with status (active, expired)
  - Create promo code form (code, discount type/value, validity, usage limit)
  - Edit/deactivate promo code
  - Usage statistics
  - E2E tests

---

### Sprint 8: Analytics & Reporting

#### TASK-062: Analytics Service — ETL Pipeline
- **Description:** Implement ETL pipeline from PostgreSQL to Redshift for historical analytics
- **Target Files:**
  - `dev/services/analytics-service/app.py`
  - `dev/services/analytics-service/etl/postgres-to-redshift.py`
  - `dev/infrastructure/terraform/redshift.tf`
- **Depends On:** TASK-003 (PostgreSQL)
- **Satisfies:** REQ-060 (platform analytics)
- **Sprint:** Sprint 8
- **DoD:**
  - Redshift cluster provisioned (dc2.large, 2 nodes)
  - Daily ETL job scheduled (AWS Glue or custom script)
  - Data copied from PostgreSQL to Redshift (bookings, payments, reviews)
  - Aggregation tables created (daily bookings, revenue by hotel)
  - Unit tests

---

#### TASK-063: Hotel Manager Reports — Revenue Report
- **Description:** Implement revenue report by month/quarter
- **Target Files:**
  - `dev/web-admin/hotel-manager/src/pages/RevenueReport.tsx`
  - `dev/services/analytics-service/routes/hotel-revenue.py`
- **Depends On:** TASK-062 (Analytics Service)
- **Satisfies:** REQ-053 (earnings reports)
- **Sprint:** Sprint 8
- **DoD:**
  - Revenue chart by month (last 12 months)
  - Total revenue, total bookings, avg booking value
  - Filter by date range
  - CSV export functionality
  - E2E tests

---

#### TASK-064: Hotel Manager Reports — Occupancy Rate
- **Description:** Implement occupancy rate trends report
- **Target Files:**
  - `dev/web-admin/hotel-manager/src/pages/OccupancyReport.tsx`
  - `dev/services/analytics-service/routes/hotel-occupancy.py`
- **Depends On:** TASK-062 (Analytics Service)
- **Satisfies:** REQ-046 (dashboard occupancy)
- **Sprint:** Sprint 8
- **DoD:**
  - Occupancy rate chart (last 12 months)
  - Average occupancy %, peak months
  - Room type breakdown
  - CSV export
  - E2E tests

---

#### TASK-065: Hotel Manager Reports — Cancellation Rate Analysis
- **Description:** Implement cancellation rate analysis report
- **Target Files:**
  - `dev/web-admin/hotel-manager/src/pages/CancellationReport.tsx`
  - `dev/services/analytics-service/routes/hotel-cancellations.py`
- **Depends On:** TASK-062 (Analytics Service)
- **Satisfies:** REQ-053 (earnings reports)
- **Sprint:** Sprint 8
- **DoD:**
  - Cancellation rate chart (last 12 months)
  - Cancellation reasons breakdown
  - Financial impact (refunded amount)
  - CSV export
  - E2E tests

---

#### TASK-066: Super Admin Analytics — Platform-Wide Dashboard
- **Description:** Implement platform-wide analytics dashboard
- **Target Files:**
  - `dev/web-admin/super-admin/src/pages/PlatformAnalytics.tsx`
  - `dev/services/analytics-service/routes/platform-summary.py`
- **Depends On:** TASK-062 (Analytics Service)
- **Satisfies:** REQ-060 (platform analytics)
- **Sprint:** Sprint 8
- **DoD:**
  - Key metrics cards (total bookings, revenue, active users, active hotels)
  - Bookings trend chart (last 12 months)
  - Revenue trend chart (last 12 months)
  - User growth chart
  - Top hotels by bookings/revenue (top 10)
  - E2E tests

---

#### TASK-067: Super Admin Analytics — Conversion Funnel
- **Description:** Implement conversion funnel analysis (search → booking)
- **Target Files:**
  - `dev/web-admin/super-admin/src/pages/ConversionFunnel.tsx`
  - `dev/services/analytics-service/routes/conversion-funnel.py`
- **Depends On:** TASK-062 (Analytics Service)
- **Satisfies:** REQ-060 (platform analytics)
- **Sprint:** Sprint 8
- **DoD:**
  - Funnel visualization (searches → hotel views → booking drafts → payments → confirmations)
  - Conversion rate at each step
  - Drop-off analysis
  - Filter by date range
  - E2E tests

---

#### TASK-068: Super Admin Analytics — Payment Success/Failure Rates
- **Description:** Implement payment analytics dashboard
- **Target Files:**
  - `dev/web-admin/super-admin/src/pages/PaymentAnalytics.tsx`
  - `dev/services/analytics-service/routes/payment-metrics.py`
- **Depends On:** TASK-062 (Analytics Service)
- **Satisfies:** REQ-060 (platform analytics)
- **Sprint:** Sprint 8
- **DoD:**
  - Payment success rate (last 30 days)
  - Failure reasons breakdown (declined, fraud, timeout)
  - Payment method distribution (card, PayPal, wallets)
  - Average payment processing time
  - E2E tests

---

### Sprint 9: Integration Testing & Performance Tuning

#### TASK-069: E2E Test Suite — Customer Booking Flow
- **Description:** Implement end-to-end test for full customer booking flow
- **Target Files:**
  - `test-automation/e2e-tests/customer-booking-flow.spec.ts`
- **Depends On:** TASK-048 (Mobile app booking complete)
- **Satisfies:** All customer-facing requirements (REQ-001 to REQ-044)
- **Sprint:** Sprint 9
- **DoD:**
  - Test covers: Login → Search → Select Hotel → View Details → Book Room → Enter Payment → Confirmation
  - Test validates booking appears in My Bookings
  - Test validates email/SMS confirmation received
  - Test runs in CI pipeline (staging environment)

---

#### TASK-070: E2E Test Suite — Hotel Manager Workflow
- **Description:** Implement end-to-end test for hotel manager workflow
- **Target Files:**
  - `test-automation/e2e-tests/hotel-manager-workflow.spec.ts`
- **Depends On:** TASK-056 (Hotel Manager Panel complete)
- **Satisfies:** Hotel manager requirements (REQ-045 to REQ-053)
- **Sprint:** Sprint 9
- **DoD:**
  - Test covers: Login → Add Hotel → Upload Photos → Add Room Type → Set Pricing → Block Dates → View Booking → Process Refund → View Report
  - Test runs in CI pipeline (staging environment)

---

#### TASK-071: E2E Test Suite — Super Admin Workflow
- **Description:** Implement end-to-end test for super admin workflow
- **Target Files:**
  - `test-automation/e2e-tests/super-admin-workflow.spec.ts`
- **Depends On:** TASK-061 (Super Admin Panel complete)
- **Satisfies:** Super admin requirements (REQ-054 to REQ-061)
- **Sprint:** Sprint 9
- **DoD:**
  - Test covers: Login → Approve Hotel → Deactivate User → Create Promo Code → Settle Payment → Resolve Dispute → View Analytics
  - Test runs in CI pipeline (staging environment)

---

#### TASK-072: Load Testing — Elasticsearch Cluster Validation (DR-02 Resolution)
- **Description:** Full-scale load test to validate Elasticsearch cluster sizing
- **Target Files:**
  - `test-automation/load-tests/elasticsearch-sizing-test.spec.ts`
- **Depends On:** TASK-004 (Elasticsearch baseline), TASK-022 (Search Service)
- **Satisfies:** NFR-001 (search performance), NFR-004 (concurrent users)
- **Sprint:** Sprint 9
- **DoD:**
  - Load test simulates 100K concurrent users (10K concurrent searches)
  - Production-scale dataset indexed (100K hotels, 1M bookings)
  - p95 latency < 2 seconds validated
  - CPU utilization < 80% under load
  - JVM heap < 75% under load
  - If targets not met, cluster resized (5 nodes or r6g.2xlarge) and re-tested

---

#### TASK-073: Load Testing — API Response Time Validation
- **Description:** Load test all API endpoints to validate <500ms p95 response time
- **Target Files:**
  - `test-automation/load-tests/api-response-time-test.spec.ts`
- **Depends On:** All backend services deployed
- **Satisfies:** NFR-006 (database query performance)
- **Sprint:** Sprint 9
- **DoD:**
  - Load test covers all critical endpoints (search, booking, payment)
  - 100K concurrent users simulated
  - p95 response time < 500ms validated
  - Database query optimization applied if needed
  - Redis cache hit rate > 80%

---

#### TASK-074: Load Testing — Payment Processing Stress Test
- **Description:** Stress test payment processing under high load
- **Target Files:**
  - `test-automation/load-tests/payment-processing-test.spec.ts`
- **Depends On:** TASK-027, TASK-028 (Payment Service)
- **Satisfies:** NFR-002 (payment processing time)
- **Sprint:** Sprint 9
- **DoD:**
  - Load test simulates 1K concurrent payments
  - p95 payment processing time < 5 seconds validated
  - Stripe API latency monitored separately
  - Circuit breaker pattern tested (fallback to PayPal if Stripe fails)

---

#### TASK-075: Performance Optimization — Database Query Tuning
- **Description:** Optimize slow database queries identified during load testing
- **Target Files:**
  - `dev/database/migrations/010_performance_indexes.sql`
  - `dev/services/*/query-optimization-notes.md`
- **Depends On:** TASK-073 (API response time test)
- **Satisfies:** NFR-006 (database performance)
- **Sprint:** Sprint 9
- **DoD:**
  - Slow query log analyzed (queries > 500ms)
  - Missing indexes added (composite indexes for complex filters)
  - Query plans optimized (EXPLAIN ANALYZE)
  - Re-test confirms queries < 500ms

---

#### TASK-076: Bug Triage & Fixes
- **Description:** Triage and fix bugs identified during Sprint 9 testing
- **Target Files:** Various (as needed)
- **Depends On:** TASK-069 to TASK-075 (testing complete)
- **Satisfies:** General quality
- **Sprint:** Sprint 9
- **DoD:**
  - All P0 bugs fixed and verified
  - All P1 bugs fixed or scheduled for buffer period
  - P2/P3 bugs triaged and documented for post-launch

---

## 4. Database Schema

### Core Tables

```sql
-- Users & Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255),
  social_provider VARCHAR(20), -- 'google', 'facebook', NULL
  social_id VARCHAR(255),
  role VARCHAR(20) NOT NULL, -- 'customer', 'hotel_manager', 'admin'
  is_verified BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_phone (phone),
  INDEX idx_social (social_provider, social_id)
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  device_info JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_id (user_id),
  INDEX idx_token (token)
);

CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  nationality VARCHAR(2), -- ISO 3166-1 alpha-2
  profile_picture TEXT, -- S3 URL
  preferences JSONB DEFAULT '{
    "currency": "USD",
    "language": "en",
    "notifications": {"email": true, "sms": true, "push": true}
  }',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL, -- 'stripe', 'paypal'
  token_id VARCHAR(255) NOT NULL, -- Provider token
  last4 VARCHAR(4) NOT NULL,
  card_type VARCHAR(20), -- 'visa', 'mastercard', etc.
  expiry_month INT,
  expiry_year INT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_id (user_id)
);

-- Hotels & Inventory
CREATE TABLE hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  star_rating INT CHECK (star_rating BETWEEN 1 AND 5),
  property_type VARCHAR(50), -- 'hotel', 'resort', 'hostel', 'apartment'
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  country VARCHAR(2) NOT NULL, -- ISO 3166-1 alpha-2
  location GEOGRAPHY(POINT, 4326), -- PostGIS for geo-spatial queries
  photos TEXT[], -- Array of S3 URLs
  policies JSONB DEFAULT '{}', -- Check-in/out times, cancellation policy
  manager_id UUID REFERENCES users(id),
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_location USING GIST (location),
  INDEX idx_city (city),
  INDEX idx_star_rating (star_rating)
);

CREATE TABLE amenities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL, -- 'WiFi', 'Pool', 'Gym', etc.
  icon VARCHAR(50) -- Material icon name
);

CREATE TABLE hotel_amenities (
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  amenity_id INT REFERENCES amenities(id) ON DELETE CASCADE,
  PRIMARY KEY (hotel_id, amenity_id)
);

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  room_type VARCHAR(100) NOT NULL, -- 'Standard', 'Deluxe', 'Suite'
  description TEXT,
  price_per_night DECIMAL(10, 2) NOT NULL,
  max_guests INT NOT NULL,
  total_quantity INT NOT NULL, -- Total rooms of this type
  photos TEXT[], -- Array of S3 URLs
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_hotel_id (hotel_id),
  INDEX idx_price (price_per_night)
);

CREATE TABLE room_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  available_quantity INT NOT NULL,
  is_blocked BOOLEAN DEFAULT FALSE,
  block_reason TEXT,
  UNIQUE (room_id, date),
  INDEX idx_room_date (room_id, date)
);

-- Bookings & Payments
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  hotel_id UUID REFERENCES hotels(id),
  room_id UUID REFERENCES rooms(id),
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  guests_count INT NOT NULL,
  rooms_count INT NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'draft', 'pending_payment', 'confirmed', 'cancelled', 'pending_confirmation'
  special_requests TEXT,
  base_price DECIMAL(10, 2) NOT NULL,
  taxes DECIMAL(10, 2) NOT NULL,
  fees DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL,
  promo_code VARCHAR(50),
  cancellation_policy TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_hotel_id (hotel_id),
  INDEX idx_status (status),
  INDEX idx_check_in (check_in_date)
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL, -- 'stripe', 'paypal'
  provider_transaction_id VARCHAR(255) UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
  payment_method VARCHAR(50), -- 'card', 'paypal', 'google_pay', 'apple_pay'
  idempotency_key VARCHAR(255) UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  INDEX idx_booking_id (booking_id),
  INDEX idx_status (status),
  INDEX idx_idempotency_key (idempotency_key)
);

CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  reason TEXT,
  status VARCHAR(50) NOT NULL, -- 'pending', 'completed', 'failed'
  provider_refund_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  INDEX idx_booking_id (booking_id)
);

-- Reviews & Ratings
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  hotel_id UUID REFERENCES hotels(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  moderation_reason TEXT,
  manager_response TEXT,
  manager_response_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_hotel_id (hotel_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'email', 'sms', 'push'
  subject VARCHAR(255),
  body TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'delivered'
  metadata JSONB DEFAULT '{}', -- booking_id, provider details, etc.
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);

-- Promo Codes
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed'
  discount_value DECIMAL(10, 2) NOT NULL,
  min_booking_amount DECIMAL(10, 2) DEFAULT 0,
  max_uses INT,
  current_uses INT DEFAULT 0,
  valid_from TIMESTAMP NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_code (code),
  INDEX idx_valid_dates (valid_from, valid_until)
);
```

### Key Indexes & Constraints

- **B-tree Indexes:** Standard indexes on foreign keys, status fields, dates
- **GIN Indexes:** For JSONB columns (`preferences`, `metadata`) to enable fast queries
- **GiST Indexes:** For PostGIS `location` column (geo-spatial queries)
- **Unique Constraints:** Prevent duplicate emails, phones, payment tokens, promo codes
- **Check Constraints:** Validate rating (1-5), star rating (1-5), positive prices

---

## 5. API Contracts

### Auth Service

```
POST   /api/v1/auth/register          - User registration
POST   /api/v1/auth/login             - Email/phone login
POST   /api/v1/auth/social            - Google/Facebook OAuth
POST   /api/v1/auth/forgot-password   - Password recovery
POST   /api/v1/auth/reset-password    - Reset with OTP
POST   /api/v1/auth/refresh-token     - Refresh JWT
POST   /api/v1/auth/logout            - Token invalidation
```

### User Service

```
GET    /api/v1/users/:id                      - Get profile
PUT    /api/v1/users/:id                      - Update profile
POST   /api/v1/users/:id/payment-methods      - Add payment method
GET    /api/v1/users/:id/payment-methods      - List saved methods
DELETE /api/v1/users/:id/payment-methods/:pmId - Remove method
GET    /api/v1/users/:id/bookings             - Booking history
```

### Hotel Service

```
POST   /api/v1/hotels                         - Create hotel (Admin)
GET    /api/v1/hotels/:id                     - Get hotel details
PUT    /api/v1/hotels/:id                     - Update hotel (Manager)
DELETE /api/v1/hotels/:id                     - Delete hotel (Admin)
POST   /api/v1/hotels/:id/rooms               - Create room type
PUT    /api/v1/hotels/:id/rooms/:roomId       - Update room
POST   /api/v1/hotels/:id/inventory/webhook   - PMS webhook
```

### Search Service

```
GET    /api/v1/search                         - Hotel search
GET    /api/v1/search/map                     - Map view (geo-spatial)
```

### Booking Service

```
POST   /api/v1/bookings                       - Create booking draft
GET    /api/v1/bookings/:id                   - Get booking details
POST   /api/v1/bookings/:id/apply-promo       - Apply promo code
POST   /api/v1/bookings/:id/cancel            - Cancel booking
```

### Payment Service

```
POST   /api/v1/payments/process               - Process payment (Stripe/PayPal)
POST   /api/v1/payments/webhook               - Stripe/PayPal webhook
```

### Review Service

```
POST   /api/v1/reviews                        - Submit review
GET    /api/v1/hotels/:id/reviews             - Get hotel reviews
POST   /api/v1/reviews/:id/response           - Manager response
```

### Notification Service

```
POST   /api/v1/notifications/send             - Send notification (internal)
GET    /api/v1/notifications/:userId          - Get user notifications
```

### Analytics Service

```
GET    /api/v1/analytics/hotels/:id/revenue   - Hotel revenue report
GET    /api/v1/analytics/platform/summary     - Platform-wide analytics
```

---

## 6. Testing Strategy

### Unit Testing (Jest)

- **Coverage Target:** 80% code coverage for all backend services
- **Scope:**
  - Business logic (inventory locking, refund calculation, price breakdown)
  - Data validation (email format, phone format, date ranges)
  - Error handling (API errors, database errors)
- **Tools:** Jest (Node.js), Pytest (if any Python components)
- **CI Integration:** Run on every PR, block merge if coverage < 80%

### Integration Testing (Playwright + TypeScript)

- **Target Files:** `test-automation/integration-tests/`
- **Scope:**
  - API endpoint testing (request/response validation)
  - Database integration (CRUD operations)
  - Third-party integrations (Stripe, PayPal sandbox environments)
  - Event-driven flows (booking confirmation triggers notification)
- **Test Cases:**
  - `auth.spec.ts` - Registration, login, social auth, password recovery
  - `search.spec.ts` - Hotel search with filters, sorting, pagination
  - `booking.spec.ts` - Full booking flow (draft → payment → confirmation)
  - `inventory-locking.spec.ts` - Concurrent booking prevention (DR-03 validation)
  - `cancellation.spec.ts` - Booking cancellation and refund
  - `reviews.spec.ts` - Review submission, moderation, manager response
  - `notifications.spec.ts` - Email, SMS, push notification delivery

### End-to-End Testing (Playwright)

- **Target Files:** `test-automation/e2e-tests/`
- **Scope:** Full user flows from mobile app and web panels
- **Test Cases:**
  - `customer-booking-flow.spec.ts` - Search → Select → Book → Pay → Confirm
  - `hotel-manager-flow.spec.ts` - Add hotel → Manage inventory → Process booking
  - `super-admin-flow.spec.ts` - Approve hotel → Settle payments → View analytics
- **CI Integration:** Run nightly on staging environment

### Load Testing (k6 + Grafana)

- **Target Files:** `test-automation/load-tests/`
- **Scope:** Performance validation for NFRs
- **Test Cases:**
  - `elasticsearch-sizing-test.spec.ts` - 10K concurrent searches, <2s p95 latency (NFR-001)
  - `api-response-time-test.spec.ts` - 100K concurrent users, <500ms p95 (NFR-006)
  - `payment-processing-test.spec.ts` - 1K concurrent payments, <5s (NFR-002)
  - `database-query-test.spec.ts` - Query response < 500ms at 80% capacity (NFR-006)
- **Execution:** Sprint 9 (baseline), Week 21-22 (full-scale)

### Security Testing

- **Tools:** OWASP ZAP, Snyk, Trivy
- **Scope:**
  - OWASP Top 10 vulnerability scanning
  - Dependency scanning (weekly Snyk scans)
  - Container security scanning (Trivy)
  - Penetration testing by third-party firm (Week 22-23)

---

## 7. Infrastructure Tasks

### AWS Resources (Terraform)

- **VPC:** 3 public subnets, 3 private subnets across 3 AZs
- **ECS Fargate:** 9 services (Auth, User, Hotel, Search, Booking, Payment, Review, Notification, Analytics)
- **RDS PostgreSQL:** db.r6g.2xlarge Multi-AZ + 2 read replicas
- **ElastiCache Redis:** 3-node cluster (r6g.large) with automatic failover
- **Elasticsearch:** 3-node cluster (r6g.xlarge.search) across 3 AZs
- **S3:** Buckets for images, backups, Terraform state
- **CloudFront:** CDN for image delivery
- **ALB:** Application Load Balancer with TLS 1.3 termination
- **API Gateway:** Kong on ECS Fargate
- **SQS/SNS:** Queues for async processing (notifications, indexing)
- **Lambda:** Image resizing (Lambda@Edge)
- **CloudWatch:** Logs, metrics, dashboards
- **DataDog:** APM, service tracing, custom dashboards
- **Secrets Manager:** Database credentials, API keys (90-day rotation)

### CI/CD Pipelines

- **GitHub Actions Workflows:**
  - `backend-ci.yml` - Lint, unit tests, build, push to ECR
  - `mobile-ci.yml` - Flutter tests, build APK/IPA
  - `frontend-ci.yml` - React tests, build, deploy to S3
  - `deploy-to-ecs.yml` - Blue-green deployment to ECS
- **Deployment Strategy:** Blue-green with automatic rollback on health check failures

---

## 8. Integration Tasks

### Third-Party Services

| Service | Purpose | Integration Tasks |
|---------|---------|------------------|
| **Stripe** | Payment processing | Stripe Elements (card input), Payment Intents API, 3D Secure, Radar fraud detection, webhook handler |
| **PayPal** | Payment processing | Express Checkout API, webhook handler, fallback gateway |
| **SendGrid** | Email delivery | SMTP API, email templates (Handlebars), webhook tracking, fallback to AWS SES |
| **Twilio** | SMS delivery | Programmable SMS API, OTP delivery, delivery receipts |
| **Firebase Cloud Messaging** | Push notifications | Topic-based messaging, device token management, notification preferences |
| **Google Maps** | Geocoding, map view | Geocoding API, Static Maps API, Places API (autocomplete), Maps SDK (Flutter) |
| **AWS Comprehend** | Review spam detection | Sentiment analysis, entity recognition, automated moderation |

---

## 9. Risk Mitigation

### Addressing P1 Findings

| Finding | Mitigation | Task |
|---------|-----------|------|
| **DR-01: Data Retention Contradiction** | Anonymization strategy implemented | TASK-002 |
| **DR-02: Elasticsearch Sizing** | Baseline testing (Sprint 0) + load testing (Sprint 9) | TASK-004, TASK-053 |
| **DR-03: Inventory Double-Booking** | Redis RedLock + PostgreSQL fallback | TASK-025 |
| **DR-04: PMS Inventory Sync** | Webhook API + on-request booking status | TASK-020 |

### Addressing P2 Findings

| Finding | Mitigation | Implementation |
|---------|-----------|---------------|
| **Database Connection Pooling** | PgBouncer in transaction mode, 100 connections per service | TASK-003 |
| **Single-Region Latency** | Document target market (US-only V1), CloudFront edge locations | TASK-006 |
| **Booking Service Complexity** | Saga pattern with compensating transactions | TASK-029, TASK-030 |
| **Elasticsearch Data Consistency** | Eventual consistency pattern documented, real-time availability verification | TASK-022, TASK-026 |
| **Manual Review Moderation** | Automated moderation (profanity + spam), flag only suspicious reviews | TASK-033 |
| **API Rate Limiting** | 1000 req/user/hour authenticated, 100 req/min/IP unauthenticated | TASK-007 |
| **Payment Idempotency Keys** | Required `Idempotency-Key` header, Redis 24-hour TTL | TASK-027 |

### Critical Path Risk Management

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| **Elasticsearch cluster fails to meet <2s target** | Medium | High | Phase 1 baseline test (Sprint 0) allows time to resize cluster if needed |
| **Redis lock failures cause booking losses** | Low | Critical | PostgreSQL row-level locks as fallback |
| **Stripe API latency spikes** | Medium | Medium | Circuit breaker pattern, fallback to PayPal, queue for retry |
| **Team velocity lower than estimated** | Medium | High | 6-week buffer period absorbs delays |
| **Third-party API downtime** | Low | Medium | Fallback providers (AWS SES for SendGrid, email for SMS) |
| **Security audit reveals P0 vulnerability** | Low | Critical | Allocated 1 week for fixes (Week 22-23) |

---

## 10. Execution Plan & Next Steps

### Immediate Actions (Week 1)

1. **Kickoff Meeting:** Review implementation plan with full team
2. **Tool Setup:** Provision GitHub repo, AWS accounts, development environments
3. **Sprint 0 Start:** Assign TASK-001 to TASK-009 to DevOps Engineer and Tech Lead
4. **Design Review Findings Briefing:** Tech Lead reviews P1 findings with team

### Weekly Cadence

- **Monday:** Sprint planning, task assignment, demo from previous sprint
- **Daily:** 15-minute standup (blockers, progress)
- **Wednesday:** Mid-sprint check-in (on-track assessment)
- **Friday:** Code review session, end-of-week sync

### Milestone Gates

| Milestone | Week | Criteria | Go/No-Go Decision |
|-----------|------|----------|-------------------|
| **Infrastructure Ready** | Week 2 | All AWS resources provisioned, CI/CD operational | Tech Lead |
| **Backend Services MVP** | Week 8 | Auth, User, Hotel, Search, Booking, Payment services deployed | Tech Lead |
| **Mobile App MVP** | Week 14 | End-to-end booking flow functional on iOS/Android | Mobile Lead |
| **Admin Panels Ready** | Week 16 | Hotel Manager and Super Admin panels functional | Frontend Lead |
| **Integration Testing Complete** | Week 20 | All E2E tests passing, zero P0 bugs | QA Lead |
| **Load Testing Passed** | Week 22 | NFR-001, NFR-004, NFR-006 validated | Tech Lead + DevOps |
| **Security Audit Cleared** | Week 23 | No P0/P1 vulnerabilities, PCI DSS SAQ A validated | CISO |
| **Beta Launch** | Week 24 | 1,000 beta users onboarded, <5 P0 bugs | Product Manager |
| **Production Launch** | Week 26 | Full traffic cutover, 99.9% uptime SLA met | CEO |

---

## Summary

This implementation plan provides a comprehensive roadmap for delivering the hotel booking platform MVP in 6 months (26 weeks). The plan:

- **Resolves all 4 P1 findings** from the design review before development begins
- **Decomposes architecture into 76 atomic tasks** with clear dependencies and acceptance criteria
- **Maps every task to requirements** (61 functional, 22 non-functional) for full traceability
- **Allocates work across 10 sprints** with 6-week hardening buffer to absorb delays
- **Identifies critical path** (22 weeks) with risk mitigation strategies
- **Defines comprehensive testing strategy** (unit, integration, E2E, load, security)
- **Specifies all code locations** under `dev/` (Python backend) and `test-automation/` (Playwright/TypeScript tests)

**Total Tasks:** 76  
**Total Sprints:** 10 (2 weeks each) + 6-week buffer  
**Critical Path Duration:** 22 weeks  
**MVP Launch Target:** Week 24 (Beta), Week 26 (Production)

The plan is ready for team review and execution. All tasks have clear owners, dependencies, and acceptance criteria. The 6-week buffer provides cushion for unforeseen challenges while maintaining the 6-month timeline commitment.
