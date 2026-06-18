# Database Setup Guide

## Quick Start - Get Demo Credentials Working

### Problem
The demo credentials displayed on the login pages don't work because the demo users don't exist in the database yet.

### Solution
Run the database seed script to create demo users and sample data.

---

## Step 1: Install Dependencies

```bash
cd dev/
pip install -r requirements.txt
```

---

## Step 2: Configure Database Connection

Create a `.env` file in the `dev/` directory:

```bash
# dev/.env
DATABASE_URL=postgresql://user:password@localhost:5432/hotel_booking
# Or use SQLite for quick testing:
DATABASE_URL=sqlite:///./hotel_booking.db

# JWT Settings
JWT_SECRET_KEY=your-secret-key-here-change-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=http://localhost:3001,http://localhost:3002

# Redis (optional, for development can skip)
REDIS_URL=redis://localhost:6379/0
```

**Quick Setup with SQLite (No PostgreSQL required):**

```bash
cd dev/
echo "DATABASE_URL=sqlite:///./hotel_booking.db" > .env
echo "JWT_SECRET_KEY=dev-secret-key-change-in-production" >> .env
echo "JWT_ALGORITHM=HS256" >> .env
echo "JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15" >> .env
echo "JWT_REFRESH_TOKEN_EXPIRE_DAYS=7" >> .env
echo "CORS_ORIGINS=http://localhost:3001,http://localhost:3002" >> .env
```

---

## Step 3: Run Database Seed Script

```bash
cd dev/
python seed_database.py
```

**Expected Output:**

```
Creating database tables...
✓ Tables created

🌱 Seeding database with demo data...

📝 Creating demo hotel owner...
  → Creating Grand Hotel...
  → Creating room types...
  ✓ Demo hotel owner created
    Email: owner@grandhotel.com
    Password: demo1234

🔐 Creating demo super admin...
  ✓ Demo super admin created
    Email: admin@hotelplatform.com
    Password: admin1234

✅ Database seeding completed successfully!

==================================================
DEMO CREDENTIALS
==================================================

🏨 Hotel Owner Panel (http://localhost:3001)
   Email: owner@grandhotel.com
   Password: demo1234

🛡️  Super Admin Panel (http://localhost:3002)
   Email: admin@hotelplatform.com
   Password: admin1234
==================================================
```

---

## Step 4: Start Backend Services

Now that the database is seeded, start the backend services:

**Important:** Run all uvicorn commands from the `dev/` directory, not from inside the service folders.

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

**Alternative: Set PYTHONPATH (if above doesn't work)**

```bash
# Windows PowerShell
cd dev/
$env:PYTHONPATH="$PWD"
python -m uvicorn services.auth.app:app --port 8001 --reload

# Windows CMD
cd dev/
set PYTHONPATH=%CD%
python -m uvicorn services.auth.app:app --port 8001 --reload
```

---

## Step 5: Start Frontend Applications

```bash
# Terminal 5: Owner Panel
cd frontend/owner-panel
npm install
npm run dev
# Access at: http://localhost:3001

# Terminal 6: Admin Panel
cd frontend/admin-panel
npm install
npm run dev
# Access at: http://localhost:3002
```

---

## Step 6: Test Login

### Owner Panel
1. Open http://localhost:3001
2. Click "Use demo credentials" button (or type manually)
3. Email: `owner@grandhotel.com`
4. Password: `demo1234`
5. Click "Sign In"
6. ✅ You should now be logged in!

### Admin Panel
1. Open http://localhost:3002
2. Click "Use demo credentials" button (or type manually)
3. Email: `admin@hotelplatform.com`
4. Password: `admin1234`
5. Click "Sign In"
6. ✅ You should now be logged in!

---

## Troubleshooting

### Issue: "Invalid credentials" error

**Cause:** Database not seeded or seeding failed

**Solution:**
```bash
cd dev/
python seed_database.py
```

If users already exist, you'll see:
```
⚠ Demo users already exist. Skipping seed.
```

### Issue: "Connection refused" or "Network error"

**Cause:** Backend services not running

**Solution:**
1. Check that all 4 backend services are running (ports 8001-8004)
2. Check `.env` file has correct DATABASE_URL
3. Verify no port conflicts

### Issue: "ModuleNotFoundError" when running seed script

**Cause:** Dependencies not installed

**Solution:**
```bash
cd dev/
pip install -r requirements.txt
```

### Issue: "No such table: users" error

**Cause:** Database tables not created

**Solution:** The seed script creates tables automatically. If it fails:
```bash
cd dev/
python seed_database.py --clear
```
This will recreate all tables and reseed data.

---

## Advanced Options

### Clear and Reseed Database

⚠️ **WARNING:** This deletes ALL data!

```bash
cd dev/
python seed_database.py --clear
```

You'll be prompted to confirm by typing `DELETE ALL`.

### Using PostgreSQL Instead of SQLite

1. Install PostgreSQL
2. Create database:
   ```bash
   createdb hotel_booking
   ```
3. Update `.env`:
   ```bash
   DATABASE_URL=postgresql://username:password@localhost:5432/hotel_booking
   ```
4. Run seed script:
   ```bash
   python seed_database.py
   ```

---

## What Gets Created

### Demo Users

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Hotel Owner | owner@grandhotel.com | demo1234 | Owner Panel (port 3001) |
| Super Admin | admin@hotelplatform.com | admin1234 | Admin Panel (port 3002) |

### Sample Hotel Data

- **Hotel:** Grand Plaza Hotel (5-star, New York)
- **Rooms:** 3 types (Standard, Deluxe, Executive Suite)
- **Total Capacity:** 50 rooms

---

## Next Steps

After successful login:

### As Hotel Owner:
- ✅ View dashboard with bookings and revenue
- ✅ Manage hotel profile
- ✅ Add/edit room types
- ✅ View and manage bookings
- ✅ Respond to guest reviews

### As Super Admin:
- ✅ View platform analytics
- ✅ Manage users (activate/deactivate)
- ✅ Approve/reject hotel listings
- ✅ Create promo codes
- ✅ Handle disputes

---

## Summary Command Reference

```bash
# Complete setup from scratch
cd dev/
pip install -r requirements.txt
echo "DATABASE_URL=sqlite:///./hotel_booking.db" > .env
echo "JWT_SECRET_KEY=dev-secret-key" >> .env
echo "CORS_ORIGINS=http://localhost:3001,http://localhost:3002" >> .env
python seed_database.py

# Start services (4 terminals - all from dev/ directory)
cd dev/
python -m uvicorn services.auth.app:app --port 8001 --reload
python -m uvicorn services.hotel.app:app --port 8002 --reload
python -m uvicorn services.booking.app:app --port 8003 --reload
python -m uvicorn services.payment.app:app --port 8004 --reload

# Start frontend (2 terminals)
cd frontend/owner-panel && npm install && npm run dev
cd frontend/admin-panel && npm install && npm run dev

# Access
# Owner: http://localhost:3001 (owner@grandhotel.com / demo1234)
# Admin: http://localhost:3002 (admin@hotelplatform.com / admin1234)
```

---

**Last Updated:** June 17, 2026
