# Hotel Booking Platform - Backend Services

Production-ready microservices implementation for the hotel booking platform.

## Architecture

This implementation follows a microservices architecture with the following core services:

- **Auth Service**: User authentication, JWT token management, OAuth integration
- **User Service**: User profile management, payment methods, booking history
- **Hotel Service**: Hotel CRUD, room management, amenities, PMS webhooks
- **Search Service**: Elasticsearch-based hotel search with filters and sorting
- **Booking Service**: Booking creation, inventory locking, cancellation workflow
- **Payment Service**: Stripe/PayPal integration, refund processing
- **Review Service**: User reviews with automated moderation
- **Notification Service**: Multi-channel notifications (email, SMS, push)

## Technology Stack

- **Framework**: FastAPI (async Python web framework)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Cache**: Redis (sessions, locks, cache)
- **Search**: Elasticsearch
- **Message Queue**: AWS SQS/SNS
- **Storage**: AWS S3
- **Authentication**: JWT with RS256

## Project Structure

```
dev/
├── services/               # Microservices
│   ├── auth/              # Authentication service
│   ├── user/              # User management service
│   ├── hotel/             # Hotel management service
│   ├── search/            # Search service
│   ├── booking/           # Booking service
│   ├── payment/           # Payment processing service
│   ├── review/            # Review service
│   └── notification/      # Notification service
├── shared/                # Shared libraries
│   ├── models/           # SQLAlchemy database models
│   ├── config/           # Configuration management
│   ├── utils/            # Common utilities
│   └── middleware/       # Shared middleware
├── database/             # Database migrations
│   └── migrations/       # Alembic migrations
└── requirements.txt      # Python dependencies
```

## Setup Instructions

### Prerequisites

- Python 3.10+
- PostgreSQL 14+ (or SQLite for quick testing)
- Redis 7+ (optional for development)
- Elasticsearch 8+ (optional for development)
- AWS Account (S3, SQS, SNS) - for production only

### Quick Start (SQLite + Demo Data)

For quick testing without PostgreSQL/Redis/Elasticsearch:

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Create minimal .env file**:
   ```bash
   echo "DATABASE_URL=sqlite:///./hotel_booking.db" > .env
   echo "JWT_SECRET_KEY=dev-secret-key-change-in-production" >> .env
   echo "JWT_ALGORITHM=HS256" >> .env
   echo "CORS_ORIGINS=http://localhost:3001,http://localhost:3002" >> .env
   ```

3. **Seed database with demo users**:
   ```bash
   python seed_database.py
   ```
   
   ✅ **This creates:**
   - Demo hotel owner (owner@grandhotel.com / demo1234)
   - Demo super admin (admin@hotelplatform.com / admin1234)
   - Sample hotel with rooms

4. **Start services**:
   ```bash
   # Auth Service
   cd services/auth && uvicorn app:app --port 8001 --reload
   ```

📚 **Detailed setup guide:** See [DATABASE_SETUP.md](../DATABASE_SETUP.md)

**Note:** Run from dev/ directory using: `python -m uvicorn services.auth.app:app --port 8001 --reload`

### Full Installation (Production-like)

1. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**:
   Create `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/hotel_booking
   
   # Redis
   REDIS_URL=redis://localhost:6379/0
   
   # Elasticsearch
   ELASTICSEARCH_URL=http://localhost:9200
   
   # JWT
   JWT_SECRET_KEY=your-secret-key-here
   JWT_ALGORITHM=RS256
   JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
   JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
   
   # AWS
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   S3_BUCKET_NAME=hotel-booking-images
   
   # Payment
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   PAYPAL_CLIENT_ID=your-client-id
   PAYPAL_CLIENT_SECRET=your-client-secret
   
   # Notifications
   SENDGRID_API_KEY=your-sendgrid-key
   TWILIO_ACCOUNT_SID=your-twilio-sid
   TWILIO_AUTH_TOKEN=your-twilio-token
   FCM_SERVER_KEY=your-fcm-key
   
   # OAuth
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-secret
   FACEBOOK_APP_ID=your-facebook-app-id
   FACEBOOK_APP_SECRET=your-facebook-secret
   ```

4. **Seed database with demo data**:
   ```bash
   python seed_database.py
   ```
   
   This creates demo users:
   - **Owner**: owner@grandhotel.com / demo1234
   - **Admin**: admin@hotelplatform.com / admin1234

5. **Run services**:
   ```bash
   # All commands run from dev/ directory
   cd dev/
   
   # Auth Service (Port 8001)
   python -m uvicorn services.auth.app:app --port 8001 --reload
   
   # Hotel Service (Port 8002)
   python -m uvicorn services.hotel.app:app --port 8002 --reload
   
   # Booking Service (Port 8003)
   python -m uvicorn services.booking.app:app --port 8003 --reload
   ```

## API Documentation

Once services are running, access Swagger documentation:

- Auth Service: http://localhost:8001/docs
- Hotel Service: http://localhost:8002/docs
- Booking Service: http://localhost:8003/docs

## Testing

Run tests with pytest:
```bash
pytest tests/ -v --cov=services
```

## Security Considerations

- All passwords hashed with bcrypt (cost factor 12)
- JWT tokens use RS256 asymmetric encryption
- PII encrypted at rest with AES-256
- Payment data tokenized (PCI DSS compliant)
- Rate limiting on all endpoints
- HTTPS/TLS 1.3 enforced in production

## Requirements Mapping

This implementation addresses:
- **REQ-001 to REQ-008**: Authentication & User Management
- **REQ-009 to REQ-027**: Hotel Search & Discovery
- **REQ-028 to REQ-037**: Booking & Payment
- **REQ-038 to REQ-044**: Post-Booking Features
- **REQ-045 to REQ-053**: Hotel Manager Panel APIs
- **REQ-054 to REQ-061**: Super Admin Panel APIs
- **NFR-001 to NFR-022**: Non-functional requirements

## Support

For issues or questions, refer to the architecture and requirements documents.
