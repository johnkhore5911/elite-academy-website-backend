# Monthly Current Affairs Magazine Backend Setup

This document explains the setup and usage of the Monthly Current Affairs Magazine backend system.

## Overview

The Monthly Current Affairs system allows:
- Users to purchase individual monthly magazines or complete packs
- Admins to manage magazine content (title, features, price, drive links)
- Automated email delivery with Google Drive links
- Purchase tracking and analytics

## Required Environment Variables

Add these to your `.env` file:

### Razorpay Configuration
```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
```

### Email Configuration
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### Database
```env
MONGODB_URI=your_mongodb_connection_string
```

## API Endpoints

### User Routes (`/api/monthly-current-affairs`)

#### Public Routes (No Authentication Required)
- `GET /` - Get all available magazines
- `GET /:month` - Get specific magazine info

#### Protected Routes (Authentication Required)
- `POST /purchase/:month` - Purchase single magazine
- `POST /purchase/complete-pack` - Purchase complete pack
- `GET /my/purchases` - Get user's purchases
- `GET /access/:month` - Check access to magazine
- `GET /download/:month` - Get drive link (requires access)

### Admin Routes (`/api/admin/monthly-current-affairs`)

All admin routes require authentication and admin role.

#### Magazine Management
- `POST /magazines` - Create new magazine
- `GET /magazines` - Get all magazines (including inactive)
- `GET /magazines/:month` - Get specific magazine with stats
- `PUT /magazines/:month` - Update magazine
- `DELETE /magazines/:month` - Delete magazine

#### Analytics
- `GET /purchases` - Get all purchases with filtering
- `GET /dashboard/stats` - Get dashboard statistics

## Database Models

### MonthlyCurrentAffair
```javascript
{
  month: String,        // e.g., "jan2026", "feb2026"
  title: String,        // Magazine title
  features: [String],   // Array of features
  price: Number,        // Price in INR
  driveLink: String,    // Google Drive link
  isActive: Boolean,    // Whether magazine is available
  displayOrder: Number  // Display order on frontend
}
```

### MonthlyCurrentAffairPurchase
```javascript
{
  userId: String,           // User ID
  userEmail: String,         // User email
  userName: String,          // User name
  purchaseType: String,     // 'single' or 'complete-pack'
  month: String,            // For single purchases
  monthsIncluded: [String], // For pack purchases
  orderId: String,          // Razorpay order ID
  paymentId: String,        // Razorpay payment ID
  amount: Number,           // Amount in INR
  status: String,           // 'pending', 'completed', 'failed'
  emailSent: Boolean       // Whether email was sent
}
```

## Admin Usage Examples

### Create a New Magazine
```bash
POST /api/admin/monthly-current-affairs/magazines
{
  "month": "jan2026",
  "title": "January 2026 Current Affairs",
  "features": [
    "Complete coverage of national events",
    "International relations updates",
    "Economic developments",
    "Science & technology news",
    "Sports highlights"
  ],
  "price": 99,
  "driveLink": "https://drive.google.com/file/d/YOUR_FILE_ID/view",
  "isActive": true,
  "displayOrder": 1
}
```

### Update a Magazine
```bash
PUT /api/admin/monthly-current-affairs/magazines/jan2026
{
  "price": 149,
  "features": [
    "Complete coverage of national events",
    "International relations updates",
    "Economic developments",
    "Science & technology news",
    "Sports highlights",
    "Environmental updates"
  ]
}
```

## Purchase Flow

1. User browses magazines via `GET /api/monthly-current-affairs`
2. User purchases magazine via `POST /api/monthly-current-affairs/purchase/:month`
3. Razorpay processes payment
4. Webhook updates purchase status to 'completed'
5. Automated email sent with Google Drive link
6. User can access magazine via `GET /api/monthly-current-affairs/download/:month`

## Webhook Handling

The system automatically handles Razorpay webhooks:
- Updates purchase status
- Sends confirmation emails to users
- Sends notification emails to admin
- Prevents duplicate processing

## Email Templates

The system includes professional email templates:
- User confirmation with magazine details and download links
- Admin notification with purchase details
- Responsive design with proper branding

## Security Features

- JWT authentication for protected routes
- Admin role verification for admin routes
- Purchase duplication prevention
- Access control for magazine downloads
- Webhook signature verification

## Analytics Dashboard

Admin dashboard provides:
- Total magazines and active count
- Purchase statistics (single vs pack)
- Revenue tracking
- Recent purchases
- Monthly revenue trends

## Notes

- Drive links should be publicly accessible Google Drive links
- Prices are stored in the database (not environment variables) for flexibility
- All prices are in INR
- Email delivery uses Nodemailer with SMTP
- The system prevents duplicate purchases automatically
