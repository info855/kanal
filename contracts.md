# Basit Kargo - API Contracts & Backend Implementation Plan

## Overview
This document outlines the API contracts, database schema, and integration plan for the Basit Kargo platform.

## Database Collections

### 1. Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  company: String,
  taxId: String,
  role: String (enum: ['user', 'admin']),
  balance: Number (default: 0),
  totalShipments: Number (default: 0),
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Orders Collection
```javascript
{
  _id: ObjectId,
  orderId: String (unique, auto-generated),
  userId: ObjectId (ref: Users),
  trackingCode: String (unique, auto-generated),
  recipient: {
    name: String,
    phone: String,
    city: String,
    district: String,
    address: String
  },
  shippingCompanyId: ObjectId (ref: ShippingCompanies),
  shippingCompany: String,
  status: String (enum: ['created', 'picked', 'in_transit', 'out_for_delivery', 'delivered']),
  statusText: String,
  weight: Number,
  desi: Number,
  price: Number,
  paymentType: String (enum: ['prepaid', 'cod']),
  codAmount: Number (optional),
  description: String,
  currentLocation: {
    lat: Number,
    lng: Number,
    city: String,
    district: String
  },
  timeline: [{
    date: Date,
    status: String,
    description: String
  }],
  createdAt: Date,
  deliveredAt: Date,
  updatedAt: Date
}
```

### 3. ShippingCompanies Collection
```javascript
{
  _id: ObjectId,
  name: String,
  logo: String (URL),
  price: Number,
  deliveryTime: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 4. Notifications Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: Users),
  type: String (enum: ['success', 'info', 'warning', 'error']),
  title: String,
  message: String,
  read: Boolean (default: false),
  createdAt: Date
}
```

## API Endpoints

### Authentication
- **POST /api/auth/register** - User registration
  - Request: { name, email, password, phone, company, taxId }
  - Response: { success, user, token }

- **POST /api/auth/login** - User login
  - Request: { email, password }
  - Response: { success, user, token }

- **GET /api/auth/me** - Get current user (requires auth)
  - Response: { user }

### Users
- **GET /api/users** - Get all users (admin only)
  - Response: { users }

- **GET /api/users/:id** - Get user by ID
  - Response: { user }

- **PUT /api/users/:id** - Update user
  - Request: { name, phone, company, etc. }
  - Response: { success, user }

- **PUT /api/users/:id/balance** - Update user balance
  - Request: { amount }
  - Response: { success, balance }

### Orders
- **POST /api/orders** - Create new order (requires auth)
  - Request: { recipient, shippingCompanyId, weight, desi, paymentType, codAmount, description }
  - Response: { success, order }

- **GET /api/orders** - Get user's orders (requires auth)
  - Query: ?status=, ?page=, ?limit=
  - Response: { orders, total, page, totalPages }

- **GET /api/orders/:id** - Get order by ID
  - Response: { order }

- **GET /api/orders/tracking/:trackingCode** - Track order by tracking code
  - Response: { order }

- **PUT /api/orders/:id/status** - Update order status (admin only)
  - Request: { status, location }
  - Response: { success, order }

### Admin
- **GET /api/admin/stats** - Get platform statistics (admin only)
  - Response: { totalShipments, activeShipments, totalRevenue, etc. }

- **GET /api/admin/orders** - Get all orders (admin only)
  - Query: ?status=, ?search=, ?page=, ?limit=
  - Response: { orders, total, page, totalPages }

- **GET /api/admin/users** - Get all users (admin only)
  - Query: ?search=, ?page=, ?limit=
  - Response: { users, total, page, totalPages }

### Shipping Companies
- **GET /api/shipping-companies** - Get all active shipping companies
  - Response: { companies }

- **POST /api/shipping-companies** - Create shipping company (admin only)
  - Request: { name, logo, price, deliveryTime }
  - Response: { success, company }

### Notifications
- **GET /api/notifications** - Get user notifications (requires auth)
  - Response: { notifications }

- **PUT /api/notifications/:id/read** - Mark notification as read
  - Response: { success }

## Mock Data to Replace

From `mockData.js`, the following will be replaced with real API calls:

1. **mockShippingCompanies** → GET /api/shipping-companies
2. **mockOrders** → GET /api/orders
3. **mockUsers** → GET /api/users (admin only)
4. **mockStats** → GET /api/admin/stats
5. **mockNotifications** → GET /api/notifications
6. **mockPricing** → Calculated based on shipping company prices

## Frontend-Backend Integration

### Files to Update:
1. **context/AuthContext.js**
   - Replace mock login/register with API calls
   - Add token management (localStorage)
   - Add axios interceptors for auth header

2. **pages/DashboardPage.js**
   - Fetch orders from API
   - Fetch user stats from API
   - Fetch notifications from API

3. **pages/TrackingPage.js**
   - Fetch order details from API by tracking code or order ID

4. **pages/NewShipmentPage.js**
   - Submit form data to POST /api/orders
   - Fetch shipping companies from API

5. **pages/AdminPage.js**
   - Fetch admin stats from API
   - Fetch all orders from API
   - Fetch all users from API
   - Implement search/filter functionality

## Authentication Strategy
- Use JWT tokens for authentication
- Store token in localStorage
- Add token to Authorization header for protected routes
- Implement token refresh mechanism (optional for MVP)

## Real-time Features (Phase 2)
- WebSocket integration for real-time order tracking updates
- Push notifications for order status changes
- Live map updates

## Next Steps
1. Create MongoDB models for all collections
2. Implement authentication middleware
3. Create all API endpoints
4. Update frontend to use real APIs instead of mock data
5. Test all functionality
6. Deploy
