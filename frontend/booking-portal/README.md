# Hotel Booking Portal

Customer-facing interface for searching and booking hotels.

## Overview

This is the customer booking interface where guests can:
- Search for hotels by location and dates
- View hotel details and available rooms
- Select rooms and make reservations
- Complete payment and receive booking confirmation

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
cd frontend/booking-portal
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at **http://localhost:3000**

### Access the Application

1. Open http://localhost:3000
2. Search for hotels using the search bar
3. Browse available hotels
4. Select a hotel and room
5. Complete booking with guest information
6. Process payment (demo mode)
7. Receive booking confirmation

## Features

### 🔍 Search & Browse
- Search hotels by location, dates, and number of guests
- Filter by price, star rating, and amenities
- View detailed hotel information

### 🏨 Hotel Details
- View room types and availability
- See hotel amenities and location
- Read guest reviews and ratings

### 📅 Booking Flow
1. **Search** - Find hotels matching your criteria
2. **Select** - Choose hotel and room type
3. **Book** - Enter guest information
4. **Pay** - Complete secure payment
5. **Confirm** - Receive booking confirmation

### 💳 Payment
- Secure payment processing (demo mode)
- Credit card information
- Billing address

### ✉️ Confirmation
- Booking confirmation with booking ID
- Email notification (simulated)
- Booking details summary

## Mock Data

The application includes mock data for development when the backend is not available:
- Sample hotel: Grand Plaza Hotel (5-star)
- Room types: Deluxe King Room, Executive Suite
- Guest reviews and ratings

## API Integration

The app is configured to connect to backend services via proxy:
- **API Endpoint**: `/api` → `http://localhost:8002`

### Backend Services (Optional)

To enable full functionality, start the backend services:

```bash
cd dev/
python -m uvicorn services.hotel.app:app --port 8002 --reload
python -m uvicorn services.booking.app:app --port 8003 --reload
python -m uvicorn services.payment.app:app --port 8004 --reload
```

**Note**: The app will use mock data if backend services are not available.

## Project Structure

```
booking-portal/
├── src/
│   ├── components/         # Reusable components
│   │   ├── Header.tsx     # Navigation header
│   │   ├── Footer.tsx     # Footer with links
│   │   ├── SearchBar.tsx  # Hotel search form
│   │   ├── HotelCard.tsx  # Hotel listing card
│   │   └── RoomCard.tsx   # Room details card
│   ├── pages/             # Page components
│   │   ├── HomePage.tsx           # Landing page
│   │   ├── SearchResultsPage.tsx  # Hotel search results
│   │   ├── HotelDetailsPage.tsx   # Hotel & room details
│   │   ├── BookingPage.tsx        # Guest information
│   │   ├── PaymentPage.tsx        # Payment processing
│   │   └── ConfirmationPage.tsx   # Booking confirmation
│   ├── services/          # API services
│   │   └── api.ts         # API calls and mock data
│   ├── types/             # TypeScript types
│   │   └── index.ts       # Type definitions
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # App entry point
│   └── index.css          # Global styles
├── public/                # Static assets
├── index.html             # HTML template
├── package.json           # Dependencies
├── vite.config.ts         # Vite configuration
└── tailwind.config.js     # Tailwind CSS config
```

## Technology Stack

### Frontend Framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server

### Routing
- **React Router 6** - Client-side routing

### Styling
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library

### Utilities
- **date-fns** - Date manipulation

## Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## Environment Variables

No environment variables required for development. The app uses:
- Vite proxy for API calls
- Mock data fallback when backend is unavailable

## Troubleshooting

### Port 3000 already in use

Change the port in [vite.config.ts](vite.config.ts):

```typescript
server: {
  port: 3001, // or any available port
}
```

### API calls failing

The app will automatically fall back to mock data. Check:
1. Backend services are running (ports 8002-8004)
2. Vite proxy configuration is correct
3. Check browser console for errors

### Styling not working

Ensure Tailwind CSS is properly configured:
```bash
npm install -D tailwindcss postcss autoprefixer
```

## Development Mode

Currently, the booking portal:
- ✅ Works standalone without authentication
- ✅ Uses mock data when backend is unavailable
- ✅ Full booking flow from search to confirmation
- ✅ Responsive design for mobile and desktop

## Customer Journey

1. **Land on homepage** → See hero with search bar
2. **Search hotels** → Enter location, dates, guests
3. **Browse results** → View list of available hotels
4. **Select hotel** → See details, rooms, reviews
5. **Choose room** → Select room type and dates
6. **Enter details** → Provide guest information
7. **Make payment** → Enter payment information
8. **Get confirmation** → Receive booking confirmation with ID

---

**Port**: 3000  
**Customer Interface**: Direct access (no login required)  
**Last Updated**: June 18, 2026
