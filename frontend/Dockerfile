# Stage 1: Build Vite React App
FROM node:18 AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of the source code
COPY . .

# Set environment for production build
ENV NODE_ENV=production

# Run build with clearer logs
RUN echo "===== Listing files in /app =====" && \
    ls -al /app && \
    echo "===== Checking for vite.config.js =====" && \
    if [ -f vite.config.js ]; then cat vite.config.js; else echo "❌ vite.config.js not found"; fi && \
    echo "===== Starting build =====" && \
    npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
