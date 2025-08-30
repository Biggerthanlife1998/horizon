# Horizon Bank - Render Deployment Guide

## 🚀 Deploying to Render

This guide will help you deploy your Horizon Bank monorepo to Render with both frontend and backend services.

## 📋 Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Push your code to GitHub
3. **MongoDB Atlas**: Set up a free MongoDB Atlas database (optional, Render provides MongoDB)

## 🔧 Deployment Steps

### Step 1: Prepare Your Repository

1. **Push to GitHub**: Make sure your code is pushed to a GitHub repository
2. **Environment Variables**: Update your environment variables for production

### Step 2: Deploy Backend Service

1. **Create New Web Service**:
   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Backend Service**:
   ```
   Name: horizon-bank-api
   Environment: Node
   Build Command: cd server && npm install && npm run build
   Start Command: cd server && npm start
   ```

3. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=<your-mongodb-connection-string>
   JWT_SECRET=<generate-a-secure-secret>
   CORS_ORIGIN=https://horizon-bank-frontend.onrender.com
   ADMIN_PASSWORD=<your-admin-password>
   ```

### Step 3: Deploy Frontend Service

1. **Create New Static Site**:
   - Go to Render Dashboard
   - Click "New +" → "Static Site"
   - Connect your GitHub repository

2. **Configure Frontend Service**:
   ```
   Name: horizon-bank-frontend
   Build Command: cd client && npm install && npm run build
   Publish Directory: client/dist
   ```

3. **Environment Variables**:
   ```
   VITE_API_URL=https://horizon-bank-api.onrender.com
   ```

### Step 4: Set Up Database (Optional)

1. **MongoDB Atlas** (Recommended):
   - Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Get your connection string
   - Add it to your backend environment variables

2. **Render MongoDB** (Alternative):
   - Create a new PostgreSQL service in Render
   - Use the connection string provided

## 🔗 Service URLs

After deployment, your services will be available at:
- **Frontend**: `https://horizon-bank-frontend.onrender.com`
- **Backend**: `https://horizon-bank-api.onrender.com`

## 🛠️ Using render.yaml (Alternative)

If you prefer to use the `render.yaml` file:

1. **Push render.yaml** to your repository root
2. **Create Blueprint**:
   - Go to Render Dashboard
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect and deploy all services

## 🔧 Local Development

To run locally:

```bash
# Install all dependencies
npm run install:all

# Start both services
npm run dev

# Or start individually
npm run dev:client  # Frontend on http://localhost:5173
npm run dev:server  # Backend on http://localhost:4000
```

## 📝 Environment Variables Reference

### Backend (.env)
```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/horizon-bank
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=https://horizon-bank-frontend.onrender.com
ADMIN_PASSWORD=your-admin-password
```

### Frontend (Vite)
```env
VITE_API_URL=https://horizon-bank-api.onrender.com
```

## 🚨 Important Notes

1. **Free Tier Limitations**:
   - Services sleep after 15 minutes of inactivity
   - Cold start takes ~30 seconds
   - Limited to 750 hours/month

2. **Production Considerations**:
   - Use a paid plan for production
   - Set up custom domains
   - Configure SSL certificates
   - Set up monitoring and alerts

3. **Security**:
   - Use strong JWT secrets
   - Enable CORS properly
   - Use environment variables for sensitive data
   - Consider rate limiting

## 🔍 Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check Node.js version compatibility
   - Ensure all dependencies are in package.json
   - Check build logs in Render dashboard

2. **CORS Errors**:
   - Verify CORS_ORIGIN matches your frontend URL
   - Check backend CORS configuration

3. **Database Connection**:
   - Verify MongoDB connection string
   - Check network access in MongoDB Atlas
   - Ensure database user has proper permissions

4. **Environment Variables**:
   - Double-check all required variables are set
   - Verify variable names match your code
   - Check for typos in values

## 📞 Support

If you encounter issues:
1. Check Render service logs
2. Verify environment variables
3. Test locally first
4. Check Render documentation

## 🎉 Success!

Once deployed, your Horizon Bank application will be live and accessible worldwide!

**Frontend**: https://horizon-bank-frontend.onrender.com
**Backend**: https://horizon-bank-api.onrender.com
