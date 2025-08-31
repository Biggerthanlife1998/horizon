# Stage 1: Build the React application
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with specific flags to handle Rollup issues
RUN npm install --legacy-peer-deps --no-optional --no-audit --no-fund

# Copy source code
COPY . .

# Build the application with environment variables
ENV VITE_API_URL=https://horizon-bank-api.onrender.com/api
RUN npx vite build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy built files from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
