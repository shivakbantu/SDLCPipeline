# Hotel Booking Platform - Quick Start Guide

## ⚠️ IMPORTANT: Database Setup Required First!

The demo credentials will NOT work until you seed the database. Follow Step 0 below.

---

## 🗄️ Step 0: Setup Database (REQUIRED)

**This is the most important step!** The demo users don't exist until you run the seed script.

```bash
cd dev/

# Quick setup with SQLite (recommended for testing)
echo "DATABASE_URL=sqlite:///./hotel_booking.db" > .env
echo "JWT_SECRET_KEY=dev-secret-key-change-in-production" >> .env
echo "JWT_ALGORITHM=HS256" >> .env
echo "CORS_ORIGINS=http://localhost:3001,http://localhost:3002" >> .env

# Install dependencies
pip install -r requirements.txt

# Seed database with demo users
python seed_database.py
```

**Expected output:**
```
✅ Database seeding completed successfully!
Email: owner@grandhotel.com / Password: demo1234
Email: admin@hotelplatform.com / Password: admin1234
```

📚 **Detailed Setup Guide:** See [DATABASE_SETUP.md](DATABASE_SETUP.md) for full instructions

---

## 🚀 Access URLs

| Application | URL | Purpose |
|------------|-----|---------|
| **Booking Portal** | http://localhost:3000 | **Customer booking interface** |
| **Owner Panel** | http://localhost:3001 | Hotel management interface |
| **Admin Panel** | http://localhost:3002 | Platform administration |
| **Auth API** | http://localhost:8001/docs | Authentication service |
| **Hotel API** | http://localhost:8002/docs | Hotel service |
| **Booking API** | http://localhost:8003/docs | Booking service |
| **Payment API** | http://localhost:8004/docs | Payment service |

---

## 🔐 Demo Credentials

**Note:** Authentication is disabled for development. All frontend apps load directly without requiring login.

### Customer Booking Portal (http://localhost:3000)
- Direct access to search and book hotels
- No login required
- Full booking flow: search → select → book → pay → confirm

### Hotel Owner Panel (http://localhost:3001)
- Direct access to hotel management dashboard
- No login required

### Super Admin Panel (http://localhost:3002)
- Direct access to platform administration
- No login required

⚠️ **Development Mode:** Login has been disabled to simplify testing. For production, re-enable authentication in App.tsx.

---

## 🏃 Quick Start

### 0️⃣ Setup Database (DO THIS FIRST!)

```bash
cd dev/
pip install -r requirements.txt

# Create .env file
echo "DATABASE_URL=sqlite:///./hotel_booking.db" > .env
echo "JWT_SECRET_KEY=dev-secret-key" >> .env
echo "CORS_ORIGINS=http://localhost:3001,http://localhost:3002" >> .env

# Seed database with demo users
python seed_database.py
```

✅ **You should see:** Demo credentials printed in console

### 1️⃣ Start Backend Services (Required)

**Run all commands from the `dev/` directory:**

```bash
# Terminal 1: Auth Service
cd dev/
python -m uvicorn services.auth.app:app --port 8001 --reload

# Terminal 2: Hotel Service  
cd dev/
python -m uvicorn services.hotel.app:app --port 8002 --reload

# Terminal 3: Booking Service
cd dev/
python -m uvicorn services.booking.app:app --port 8003 --reload

# Terminal 4: Payment Service
cd dev/
python -m uvicorn services.payment.app:app --port 8004 --reload
```

### 2️⃣ Start Frontend Applications

```bash
# Terminal 5: Customer Booking Portal
cd frontend/booking-portal
npm install
npm run dev

# Terminal 6: Owner Panel
cd frontend/owner-panel
npm install
npm run dev

# Terminal 7: Admin Panel
cd frontend/admin-panel
npm install
npm run dev
```

### 3️⃣ Open in Browser

- Owner Panel: http://localhost:3001
- Admin Panel: http://localhost:3002

---

## 📚 Documentation

| Document | Location | Description |
|----------|----------|-------------|
| **Login Credentials** | `frontend/LOGIN_CREDENTIALS.md` | Complete credentials guide |
| **Implementation Report** | `frontend/IMPLEMENTATION_REPORT.md` | Frontend technical details |
| **Owner Panel README** | `frontend/owner-panel/README.md` | Owner panel setup guide |
| **Admin Panel README** | `frontend/admin-panel/README.md` | Admin panel setup guide |
| **Requirements** | `requirements.md` | Full project requirements |
| **Architecture** | `architecture.md` | System architecture design |
| **Implementation Plan** | `impl-plan.md` | Detailed task breakdown |

---

## ✨ Features Implemented

### Owner Panel
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
| **Database** | PostgreSQL + Redis |
| **Styling** | Tailwind CSS |
| **Charts** | Chart.js |
| **Authentication** | JWT (RS256) |
| **API Docs** | OpenAPI/Swagger |

---

## 🔧 Troubleshooting

### "Network error" on page load

**Cause:** Backend services not running (if pages try to fetch data)

**Solution:**
1. Verify backend services are running (ports 8001-8004)
2. Check browser console for error messages
3. Ensure no firewall blocking localhost

### Page shows blank or errors

**Cause:** npm dependencies not installed or build issues

**Solution:**
```bash
cd frontend/owner-panel
npm install
npm run dev
```

---

## 📞 Need Help?

- Check API documentation: http://localhost:8001/docs
- Review README files in each directory
- Check browser console for error messages
- Verify all services are running

---

**Last Updated:** June 17, 2026  
**Version:** Phase 5 Complete
