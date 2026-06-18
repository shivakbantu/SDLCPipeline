# Hotel Booking Platform

Full-stack hotel booking application with mobile app, admin panel, and backend microservices.

## 🚨 FIRST TIME SETUP - READ THIS!

**Demo credentials won't work until you seed the database!** 

Follow these 3 steps:

```bash
# Step 1: Setup database
cd dev/
pip install -r requirements.txt
echo "DATABASE_URL=sqlite:///./hotel_booking.db" > .env
echo "JWT_SECRET_KEY=dev-secret-key" >> .env
echo "CORS_ORIGINS=http://localhost:3001,http://localhost:3002" >> .env
python seed_database.py

# Step 2: Start backend (in separate terminals)
cd services/auth && uvicorn app:app --port 8001 --reload

# Step 3: Start frontend (in separate terminals)
cd frontend/owner-panel && npm install && npm run dev
cd frontend/admin-panel && npm install && npm run dev
```

**Demo Credentials:**
- **Owner Panel** (http://localhost:3001): owner@grandhotel.com / demo1234
- **Admin Panel** (http://localhost:3002): admin@hotelplatform.com / admin1234

📚 **Detailed Guides:**
- [Database Setup Guide](DATABASE_SETUP.md) - Complete database configuration
- [Quick Start Guide](QUICK_START.md) - Fast setup reference
- [Credentials Fix](DEMO_CREDENTIALS_FIX.md) - How the fix works

---

## 📋 Project Overview

### Type
Mobile App (iOS/Android) + Admin Panel

### Goal
Allow users to search, view, compare, and book hotel rooms online.

---

## 🏗️ Architecture

### Frontend
- **Owner Panel** (React + TypeScript) - Hotel management interface
- **Admin Panel** (React + TypeScript) - Platform administration
- **Mobile App** (Flutter) - Customer booking app [Planned]

### Backend (Python + FastAPI)
- Auth Service (Port 8001) - Authentication & JWT
- Hotel Service (Port 8002) - Hotel management
- Booking Service (Port 8003) - Reservations & inventory
- Payment Service (Port 8004) - Stripe/PayPal integration

### Database
- PostgreSQL / SQLite - Primary database
- Redis - Caching & distributed locking
- Elasticsearch - Hotel search [Planned]

---

## ✨ Features Implemented

### Customer Booking Portal
✅ Hotel search by location, dates, and guests  
✅ Browse hotel listings with filters  
✅ View hotel details, rooms, and reviews  
✅ Select rooms with availability check  
✅ Guest information collection  
✅ Payment processing (demo mode)  
✅ Booking confirmation with booking ID  
✅ Mock data fallback (works without backend)  
✅ Responsive design (mobile & desktop)  

### Hotel Owner Panel
✅ JWT Authentication with auto-refresh  
✅ Hotel owner self-registration  
✅ Dashboard with analytics  
✅ Hotel profile management  
✅ Room inventory management  
✅ Booking management (view, confirm, cancel)  
✅ Guest reviews with responses  
✅ Revenue reports and charts  

### Admin Panel
✅ Super admin authentication  
✅ Platform-wide analytics  
✅ User management (activate/deactivate)  
✅ Hotel approval and verification  
✅ Promo code management  
✅ Dispute resolution interface  
✅ Commission tracking  

### Backend Services
✅ Auth Service (JWT, OAuth stubs)  
✅ Hotel Service (CRUD, PMS webhooks)  
✅ Booking Service (inventory locking)  
✅ Payment Service (Stripe/PayPal stubs)  
✅ Redis distributed locking  
✅ PostgreSQL database models  
✅ OpenAPI documentation  

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Backend** | Python + FastAPI + SQLAlchemy |
| **Database** | PostgreSQL / SQLite + Redis |
| **Styling** | Tailwind CSS |
| **Charts** | Chart.js |
| **Authentication** | JWT (RS256/HS256) |
| **API Docs** | OpenAPI/Swagger |

---

## 📂 Project Structure

```
SDLCPipeline/
├── dev/                      # Backend services
│   ├── services/
│   │   ├── auth/            # Authentication (port 8001)
│   │   ├── hotel/           # Hotel management (port 8002)
│   │   ├── booking/         # Booking system (port 8003)
│   │   └── payment/         # Payment processing (port 8004)
│   ├── shared/              # Shared models & utilities
│   ├── seed_database.py     # Database seeding script
│   └── requirements.txt     # Python dependencies
│
├── frontend/
│   ├── booking-portal/      # Customer booking interface (port 3000)
│   ├── owner-panel/         # Hotel owner interface (port 3001)
│   ├── admin-panel/         # Admin interface (port 3002)
│   └── AUTH_DISABLED.md     # Authentication status reference
│
├── requirements.md          # Project requirements
├── architecture.md          # System architecture
├── design-review.md         # Architecture review
├── impl-plan.md            # Implementation plan
├── DATABASE_SETUP.md        # Database setup guide
├── QUICK_START.md          # Quick reference
└── DEMO_CREDENTIALS_FIX.md # How demo login works
```

---

## 🚀 Access URLs

| Application | URL | Purpose | Status |
|-------------|-----|---------|--------|
| **Booking Portal** | http://localhost:3000 | **Customer booking interface** | ✅ Direct access |
| **Owner Panel** | http://localhost:3001 | Hotel management | ✅ Direct access (no login) |
| **Admin Panel** | http://localhost:3002 | Platform admin | ✅ Direct access (no login) |
| **Auth API** | http://localhost:8001/docs | Auth service docs | Optional |
| **Hotel API** | http://localhost:8002/docs | Hotel service docs | Optional |
| **Booking API** | http://localhost:8003/docs | Booking service docs | Optional |
| **Payment API** | http://localhost:8004/docs | Payment service docs | Optional |

**Note:** All frontend apps have authentication disabled for development and load directly.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [requirements.md](requirements.md) | 83 functional & non-functional requirements |
| [architecture.md](architecture.md) | System architecture & tech decisions |
| [design-review.md](design-review.md) | Architecture review & approval |
| [impl-plan.md](impl-plan.md) | 76 implementation tasks breakdown |
| [DATABASE_SETUP.md](DATABASE_SETUP.md) | Complete database setup guide |
| [QUICK_START.md](QUICK_START.md) | Fast setup reference |
| [DEMO_CREDENTIALS_FIX.md](DEMO_CREDENTIALS_FIX.md) | Demo login technical details |

---

## 🔐 Demo Credentials

**Authentication is currently disabled for development.**

Both frontend panels (Owner Panel and Admin Panel) will load directly without requiring login.

- **Owner Panel:** http://localhost:3001 → Goes directly to dashboard
- **Admin Panel:** http://localhost:3002 → Goes directly to dashboard

### Re-enabling Authentication

See [frontend/AUTH_DISABLED.md](frontend/AUTH_DISABLED.md) for instructions on how to restore authentication if needed.

### Backend Authentication (Still Available)

The backend authentication services are still functional if you need them:
- Demo hotel owner: owner@grandhotel.com / demo1234
- Demo super admin: admin@hotelplatform.com / admin1234

⚠️ **Note:** Run `python dev/seed_database.py` first to create demo users in database.

---

## 🔧 Troubleshooting

### "Invalid credentials" error
**Solution:** Database not seeded. Run `python dev/seed_database.py`

### "Connection refused" error
**Solution:** Backend services not running. Start auth service on port 8001

### "ModuleNotFoundError"
**Solution:** Install dependencies: `pip install -r dev/requirements.txt`

### Still having issues?
📖 Read [DATABASE_SETUP.md](DATABASE_SETUP.md) for detailed troubleshooting

---

## 🎯 SDLC Pipeline Status

- ✅ Phase 1: Requirements (83 requirements documented)
- ✅ Phase 2: Architecture (Microservices + React + Flutter)
- ✅ Phase 3: Design Review (APPROVED with conditions)
- ✅ Phase 4: Implementation Plan (76 tasks defined)
- ✅ Phase 5: Implementation (Backend + Frontend complete)
- ⏳ Phase 6: Code Review (Next)
- ⏳ Phase 7: Verification (Testing)
- ⏳ Phase 8: Pull Request (Documentation)

---

## 🤝 Contributing

This is a capstone SDLC demonstration project following a complete software development lifecycle.

---

## 📄 License

Educational/Demo Project - 2026

---

## 🆘 Need Help?

1. Check [QUICK_START.md](QUICK_START.md) for fast setup
2. Read [DATABASE_SETUP.md](DATABASE_SETUP.md) for detailed instructions
3. Review [DEMO_CREDENTIALS_FIX.md](DEMO_CREDENTIALS_FIX.md) for technical details
4. Check browser console for frontend errors
5. Check terminal output for backend errors

**Last Updated:** June 17, 2026
