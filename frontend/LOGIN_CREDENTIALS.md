# Hotel Booking Platform - Login Credentials Guide

This document provides all necessary login credentials and access information for the hotel booking platform.

---

## 🏨 Hotel Owner/Manager Panel

**URL:** http://localhost:3001

### Demo Login Credentials

Use these credentials to quickly test the owner panel:

```
Email: owner@grandhotel.com
Password: demo1234
```

### Creating a New Hotel Owner Account

Hotel owners can self-register through the platform:

1. **Navigate to:** http://localhost:3001
2. **Click:** "Sign up here" link on the login page
3. **Fill in the registration form:**
   - Hotel Name (e.g., "Sunset Resort & Spa")
   - Owner Name (e.g., "John Smith")
   - Email Address (e.g., "john@sunsetresort.com")
   - Phone Number (e.g., "+1 234 567 8900")
   - Password (minimum 8 characters)
   - Confirm Password

4. **Submit** the registration
5. **Wait for approval** (24-48 hours)
6. **Check email** for approval notification
7. **Login** with your credentials

### Features Available After Login

- ✅ Dashboard with bookings overview, occupancy rates, revenue
- ✅ Hotel profile management (description, photos, amenities)
- ✅ Room inventory management (add/edit rooms, set pricing)
- ✅ Booking management (view, confirm, cancel, check-in/out)
- ✅ Guest reviews (view and respond)
- ✅ Revenue reports and analytics

---

## 🛡️ Super Admin Panel

**URL:** http://localhost:3002

### Demo Admin Credentials

**RESTRICTED ACCESS** - For platform administrators only:

```
Email: admin@hotelplatform.com
Password: admin1234
```

### How Admin Accounts Are Created

⚠️ **Important:** Admin accounts are NOT available for public signup. They are created by:
- System administrators via database seeding
- Other super admins through the admin panel
- Backend API calls (requires root access)

### Features Available After Login

- ✅ Platform-wide analytics dashboard
- ✅ User management (activate, deactivate, delete users)
- ✅ Hotel management (approve, reject, verify listings)
- ✅ Promo code management (create, edit, deactivate)
- ✅ Dispute resolution interface
- ✅ Commission tracking and settlement
- ✅ Platform configuration

---

## 🔐 Security Best Practices

### For Development/Testing

1. **Demo Credentials**: Use the provided demo credentials for testing only
2. **Environment**: These credentials work in development mode (localhost)
3. **Backend**: Ensure backend services are running (ports 8001-8004)

### For Production Deployment

1. **Change All Passwords**: Replace demo credentials with strong, unique passwords
2. **Enable 2FA**: Implement two-factor authentication for admin accounts
3. **Rotate Secrets**: Regular rotation of JWT secrets and API keys
4. **Audit Logs**: Enable comprehensive logging for all admin actions
5. **Rate Limiting**: Implement rate limiting on login endpoints
6. **HTTPS Only**: Enforce HTTPS in production
7. **Session Timeout**: Configure appropriate session timeout values

---

## 🚀 Quick Start Commands

### Start Backend Services (Required First)

```bash
# Terminal 1: Auth Service
cd dev/services/auth
uvicorn app:app --port 8001 --reload

# Terminal 2: Hotel Service
cd dev/services/hotel
uvicorn app:app --port 8002 --reload

# Terminal 3: Booking Service
cd dev/services/booking
uvicorn app:app --port 8003 --reload

# Terminal 4: Payment Service
cd dev/services/payment
uvicorn app:app --port 8004 --reload
```

### Start Frontend Applications

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

## 🧪 Testing Scenarios

### Scenario 1: Hotel Owner Workflow

1. **Register** a new hotel using the signup page
2. **Login** with your new credentials (or use demo account)
3. **Complete** hotel profile with photos and amenities
4. **Add** room types with pricing
5. **Monitor** bookings as they come in
6. **Respond** to guest reviews

### Scenario 2: Admin Workflow

1. **Login** to admin panel with admin credentials
2. **Review** pending hotel registrations
3. **Approve** or reject new hotel listings
4. **Create** promotional codes for marketing campaigns
5. **Monitor** platform analytics and revenue
6. **Handle** user disputes and issues

---

## 🆘 Troubleshooting

### Login Issues

**Problem:** "Login failed" error
- ✅ Verify backend services are running (check ports 8001-8004)
- ✅ Check browser console for API errors
- ✅ Ensure correct email/password (case-sensitive)
- ✅ Clear browser cache and cookies

**Problem:** "Network error" on login
- ✅ Verify .env file has correct API URLs
- ✅ Check CORS configuration in backend
- ✅ Ensure no firewall blocking localhost connections

**Problem:** Demo credentials not working
- ✅ Verify you're using the correct panel URL
- ✅ Check backend database has seed data
- ✅ Try typing credentials manually (copy-paste issues)

### Signup Issues

**Problem:** Registration form not submitting
- ✅ Check all required fields are filled
- ✅ Ensure passwords match
- ✅ Password must be at least 8 characters
- ✅ Valid email format required

**Problem:** "Email already exists" error
- ✅ Use a different email address
- ✅ Or recover existing account

---

## 📞 Support

For issues or questions:
- Check the project README files
- Review API documentation at http://localhost:8001/docs
- Check browser console for error messages
- Verify all services are running correctly

---

## 🔑 Credentials Summary Table

| Panel | URL | Email | Password | Access Level |
|-------|-----|-------|----------|--------------|
| **Owner Panel** | http://localhost:3001 | owner@grandhotel.com | demo1234 | Hotel Owner |
| **Admin Panel** | http://localhost:3002 | admin@hotelplatform.com | admin1234 | Super Admin |

**Last Updated:** 2026-06-17
