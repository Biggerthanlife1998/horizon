# Use Node.js 20 LTS (more stable than 24.x)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with specific flags to handle Rollup issues
RUN npm install --legacy-peer-deps --no-optional --no-audit --no-fund

# Copy source code
COPY . .

# Build the application with environment variables
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npx vite build

# Use nginx to serve the built files
FROM nginx:alpine

# Copy built files from the build stage
COPY --from=0 /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
