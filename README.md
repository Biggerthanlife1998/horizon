# 🏦 Horizon Bank - Full Stack Banking Application

A modern, feature-rich banking application built with React, TypeScript, Express, and MongoDB. This monorepo contains both the frontend and backend services for a complete banking experience.

## ✨ Features

### 🏠 Frontend Features
- **Professional Homepage** - Mobile-responsive landing page with glassmorphism design
- **User Authentication** - JWT-based login with protected routes
- **Dashboard** - Financial overview with account balances and recent transactions
- **Account Management** - Checking, Savings, and Credit account management
- **Advanced Transfers** - Multiple transfer speeds, saved recipients, scheduled transfers
- **Check Deposit** - Camera-based check capture (no file uploads)
- **Bill Payments** - Pay bills to multiple service providers
- **Card Services** - Debit/Credit card management with security features
- **User Profile** - Profile management with password/PIN changes
- **Customer Support** - Support ticket system
- **Admin Panel** - Comprehensive admin features for user management

### 🔧 Backend Features
- **RESTful API** - Complete backend with Express.js and TypeScript
- **MongoDB Integration** - User accounts, transactions, and card management
- **JWT Authentication** - Secure token-based authentication
- **Dynamic Data Generation** - Realistic transaction history and user data
- **Admin Operations** - User CRUD, account management, alerts
- **Security Features** - Rate limiting, CORS, input validation
- **File Uploads** - Profile picture uploads with Multer

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 8+
- MongoDB (local or Atlas)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd horizon-bank

# Install all dependencies
npm run install:all

# Set up environment variables
cp server/env.example server/.env
# Edit server/.env with your configuration

# Start development servers
npm run dev
```

### Development URLs
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:4000
- **Admin Panel**: http://localhost:5173/admin

## 🏗️ Project Structure

```
horizon-bank/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── utils/         # Utility functions
│   │   └── types/         # TypeScript types
│   └── package.json
├── server/                # Express backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── models/        # MongoDB models
│   │   ├── middleware/    # Express middleware
│   │   └── utils/         # Utility functions
│   └── package.json
├── render.yaml            # Render deployment config
├── package.json           # Monorepo configuration
└── README.md
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:client       # Start only frontend
npm run dev:server       # Start only backend

# Building
npm run build            # Build both services
npm run build:client     # Build only frontend
npm run build:server     # Build only backend

# Production
npm start                # Start production server

# Utilities
npm run install:all      # Install all dependencies
npm run clean            # Clean all build artifacts
```

## 🌐 Deployment

### Render Deployment

This application is configured for easy deployment on Render:

1. **Push to GitHub** - Ensure your code is in a GitHub repository
2. **Deploy Backend** - Create a Web Service for the server
3. **Deploy Frontend** - Create a Static Site for the client
4. **Set Environment Variables** - Configure production settings

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/horizon-bank
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=https://your-frontend-url.onrender.com
ADMIN_PASSWORD=your-admin-password
```

#### Frontend (Vite)
```env
VITE_API_URL=https://your-backend-url.onrender.com
```

## 🎯 Demo Credentials

### Admin Access
- **URL**: `/admin`
- **Password**: `admin123` (configurable via environment)

### Test User
- **Username**: `pauljamess`
- **Password**: `#Panthers123`

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Protected Routes** - Route-level security
- **Transfer PIN** - Additional security for transfers
- **Rate Limiting** - API rate limiting to prevent abuse
- **Input Validation** - Frontend and backend validation
- **CORS Protection** - Configured CORS for security
- **Environment Variables** - Sensitive data in environment variables

## 🎨 Design Features

- **Glassmorphism UI** - Modern backdrop blur effects
- **Mobile Responsive** - Perfect mobile experience
- **Smooth Animations** - Professional transitions
- **Custom Components** - Reusable UI components
- **Horizon Bank Branding** - Consistent design system

## 📱 Mobile Features

- **Responsive Design** - Works on all screen sizes
- **Touch-Friendly** - Optimized for mobile interactions
- **Camera Integration** - Check deposit with device camera
- **Mobile Navigation** - Smooth mobile menu experience

## 🔧 Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Lucide React** - Beautiful icons

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **TypeScript** - Type-safe development
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens
- **Multer** - File upload handling
- **Helmet** - Security middleware

## 📊 Database Models

- **User** - User accounts and authentication
- **Account** - Financial account information
- **Transaction** - Transaction history
- **Card** - Debit/Credit card management
- **SavedRecipient** - Transfer recipients
- **ScheduledTransfer** - Scheduled transfers

## 🚀 Performance Features

- **Code Splitting** - Optimized bundle sizes
- **Lazy Loading** - Components loaded on demand
- **Image Optimization** - Optimized images and icons
- **Caching** - Efficient data caching
- **Pagination** - Large dataset handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
1. Check the [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment issues
2. Review the code comments for implementation details
3. Check the console logs for debugging information

## 🎉 Acknowledgments

Built with modern web technologies and best practices for a professional banking application experience.

---

**Horizon Bank** - Your Trusted Financial Partner 🏦✨
