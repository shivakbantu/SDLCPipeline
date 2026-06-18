# Super Admin Panel

A comprehensive administrative dashboard for platform-wide management of the hotel booking system.

## Features

- **Dashboard**: Real-time platform metrics and quick actions
- **User Management**: Manage all users (customers, hotel owners, admins)
- **Hotel Management**: Review, approve, verify, and manage hotel listings
- **Promo Code Management**: Create and manage promotional discounts
- **Dispute Resolution**: Handle customer and hotel disputes
- **Analytics**: Comprehensive platform performance insights

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Chart.js** - Data visualization
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **date-fns** - Date manipulation

## Prerequisites

- Node.js 18+ and npm/yarn
- Backend services running (Auth, Hotel, Booking, Payment services)

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set the backend service URLs:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   VITE_AUTH_SERVICE_URL=http://localhost:8001
   VITE_HOTEL_SERVICE_URL=http://localhost:8002
   VITE_BOOKING_SERVICE_URL=http://localhost:8003
   VITE_PAYMENT_SERVICE_URL=http://localhost:8004
   ```

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at **http://localhost:3002**

**Note:** Authentication has been disabled for development. The application will directly show the admin dashboard.

### Access the Application

1. Start the development server
2. Open http://localhost:3002
3. You'll be taken directly to the admin dashboard
4. No login required for development mode

## Build for Production

```bash
npm run build
```

The production build will be created in the `dist/` directory.

## Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx       # Main layout with sidebar
│   └── ProtectedRoute.tsx  # Route authentication wrapper
├── contexts/            # React contexts
│   └── AuthContext.tsx  # Authentication state management
├── pages/               # Page components
│   ├── LoginPage.tsx    # Admin login page
│   ├── DashboardPage.tsx  # Platform dashboard
│   ├── UsersPage.tsx    # User management
│   ├── HotelsPage.tsx   # Hotel management
│   ├── PromoCodesPage.tsx  # Promo code management
│   ├── DisputesPage.tsx # Dispute resolution
│   └── AnalyticsPage.tsx  # Analytics and insights
├── services/            # API service layer
│   ├── authService.ts   # Admin authentication API
│   ├── userService.ts   # User management API
│   ├── hotelService.ts  # Hotel management API
│   ├── promoCodeService.ts  # Promo code API
│   ├── disputeService.ts  # Dispute management API
│   └── analyticsService.ts  # Analytics API
├── utils/               # Utility functions
│   └── apiClient.ts     # Axios instance with interceptors
├── App.tsx              # Main app component
├── main.tsx             # Application entry point
└── index.css            # Global styles and Tailwind imports
```

## API Integration

The admin panel communicates with backend services through admin-specific endpoints:

- **Admin Auth** (`/admin/auth/*`): Admin authentication and authorization
- **User Management** (`/admin/users/*`): User CRUD operations and status updates
- **Hotel Management** (`/admin/hotels/*`): Hotel approval, verification, and management
- **Promo Codes** (`/admin/promo-codes/*`): Promotional discount management
- **Disputes** (`/admin/disputes/*`): Dispute handling and resolution
- **Analytics** (`/admin/analytics/*`): Platform metrics and insights

### Authentication Flow

1. Admin logs in with email and password
2. Backend validates admin credentials and returns JWT tokens
3. Tokens are stored in localStorage with `admin_` prefix
4. All requests include the admin JWT token in the Authorization header
5. Protected routes require admin role authentication

## Key Features

### User Management
- View all users (customers, hotel owners, admins)
- Filter by role and status
- Activate/deactivate user accounts
- Delete users
- Search by name or email

### Hotel Management
- Review pending hotel registrations
- Approve or reject hotel listings
- Verify hotels for authenticity
- Suspend problematic hotels
- View hotel statistics and performance

### Promo Code Management
- Create promotional discount codes
- Set discount type (percentage or fixed amount)
- Configure usage limits and validity periods
- Deactivate or delete promo codes
- Track usage statistics

### Dispute Resolution
- View all disputes (refund, service, billing, other)
- Filter by status (open, investigating, resolved, closed)
- Investigate and mediate disputes
- Provide resolution notes
- Mark disputes as resolved

### Analytics Dashboard
- Platform-wide performance metrics
- Revenue trends and growth
- Booking statistics
- User distribution
- Top performing hotels
- Customizable time periods (daily, weekly, monthly)

## Security Considerations

### Access Control
- Admin-only access with role verification
- Separate token storage from regular users
- Protected routes with authentication checks

### Data Protection
- Sensitive operations require confirmation
- Audit logging for admin actions
- Secure API communication with HTTPS

## TODO: Future Enhancements

- [ ] Activity logs for admin actions
- [ ] Advanced filtering and search capabilities
- [ ] Bulk operations for user/hotel management
- [ ] Email templates for notifications
- [ ] Automated dispute resolution workflows
- [ ] Commission calculation and settlement automation
- [ ] Multi-admin roles with granular permissions
- [ ] Export analytics to PDF/Excel
- [ ] Real-time notifications for critical events
- [ ] Integration with fraud detection systems

## Troubleshooting

### Access Denied
Ensure your account has admin role privileges. Contact system administrator if needed.

### CORS Issues
Verify backend services have CORS configured to allow requests from `http://localhost:3002`

### Token Expiration
Admin tokens have shorter expiration times for security. Re-login if session expires.

### API Connection Failed
Check that all backend services are running and admin endpoints are accessible

## Admin Best Practices

1. **User Management**: Always provide reasons when suspending or deleting accounts
2. **Hotel Approval**: Verify hotel information thoroughly before approval
3. **Dispute Resolution**: Document all resolution steps clearly
4. **Promo Codes**: Set reasonable usage limits to prevent abuse
5. **Security**: Never share admin credentials or tokens

## Support

For admin panel issues or questions, please contact the development team or system administrator.

## Security Notice

⚠️ **This is a restricted administrative interface.** All actions are logged and monitored. Unauthorized access or misuse will result in immediate account suspension and potential legal action.
