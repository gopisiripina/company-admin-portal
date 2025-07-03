# Stage 1: Build Vite React App
FROM node:18 AS builder

# Set working directory
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy rest of the app files
COPY . .

# Set environment to production
ENV NODE_ENV=production

# Optional Debug: List files before building
RUN echo "📦 Files before build:" && \
    ls -la && \
    echo "📁 src:" && ls -la src || true && \
    echo "🛠 vite.config.js:" && cat vite.config.js || echo "Missing vite.config.js" && \
    echo "🏗 Building..." && \
    npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Remove default Nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy built app from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config for SPA routing (if exists)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
