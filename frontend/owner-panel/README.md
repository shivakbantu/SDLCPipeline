# Hotel Owner/Manager Panel

A comprehensive web-based management panel for hotel owners and managers to manage their properties, bookings, and revenue.

## Features

- **Dashboard**: Real-time overview of bookings, occupancy rates, and revenue metrics
- **Hotel Profile Management**: Update hotel information, amenities, policies, and photos
- **Room Management**: Add, edit, and manage room types with pricing and availability
- **Booking Management**: View, confirm, cancel, and track all bookings
- **Guest Reviews**: View and respond to guest feedback
- **Reports & Analytics**: Detailed revenue reports and performance metrics

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

The application will be available at **http://localhost:3001**

**Note:** Authentication has been disabled for development. The application will directly show the hotel management dashboard.

### Access the Application

1. Start the development server
2. Open http://localhost:3001
3. You'll be taken directly to the dashboard
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
│   ├── LoginPage.tsx    # Login page
│   ├── DashboardPage.tsx  # Dashboard overview
│   ├── HotelProfilePage.tsx  # Hotel profile management
│   ├── RoomsPage.tsx    # Room inventory management
│   ├── BookingsPage.tsx # Bookings management
│   ├── ReviewsPage.tsx  # Guest reviews
│   └── ReportsPage.tsx  # Reports and analytics
├── services/            # API service layer
│   ├── authService.ts   # Authentication API
│   ├── hotelService.ts  # Hotel API
│   ├── roomService.ts   # Room API
│   ├── bookingService.ts  # Booking API
│   └── reviewService.ts # Review API
├── utils/               # Utility functions
│   └── apiClient.ts     # Axios instance with interceptors
├── App.tsx              # Main app component
├── main.tsx             # Application entry point
└── index.css            # Global styles and Tailwind imports
```

## API Integration

The application communicates with the following backend services:

- **Auth Service** (port 8001): User authentication and JWT management
- **Hotel Service** (port 8002): Hotel profile and information
- **Booking Service** (port 8003): Booking management
- **Payment Service** (port 8004): Payment processing

### Authentication Flow

1. User logs in with email and password
2. Backend returns JWT access token and refresh token
3. Access token is stored in localStorage and attached to all API requests
4. Refresh token is used to obtain new access token when expired
5. Protected routes redirect to login if not authenticated

### JWT Token Refresh

The API client automatically handles token refresh:
- Intercepts 401 responses
- Attempts to refresh the access token using the refresh token
- Retries the original request with the new token
- Redirects to login if refresh fails

## Key Components

### AuthContext

Provides authentication state and methods throughout the app:
- `user`: Current authenticated user
- `isAuthenticated`: Boolean authentication status
- `login(email, password)`: Login method
- `logout()`: Logout method

### ProtectedRoute

Wrapper component that:
- Checks authentication status
- Shows loading spinner while checking
- Redirects to login if not authenticated

### Layout

Main layout component with:
- Sidebar navigation
- User profile section
- Logout button

## TODO: Future Enhancements

- [ ] Photo upload functionality for hotel and rooms
- [ ] Calendar view for date blocking
- [ ] Real-time notifications for new bookings
- [ ] Advanced filtering and search for bookings
- [ ] Export reports to PDF/Excel
- [ ] Multi-property management for owners with multiple hotels
- [ ] Staff user management
- [ ] Bulk operations for room management
- [ ] Integration with property management systems (PMS)

## Troubleshooting

### CORS Issues
Ensure backend services have CORS configured to allow requests from `http://localhost:3001`

### Token Expiration
If you're frequently logged out, check the JWT expiration time in the backend configuration

### API Connection Failed
Verify that all backend services are running and accessible at the configured URLs

## Support

For issues or questions, please contact the development team.
