FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first for caching
COPY package*.json ./
RUN apk add --no-cache curl \
    && npm install -g pm2 \
    && npm install

# Copy application files
COPY . .
# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Health check (using curl)
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/ || exit 1

EXPOSE 5000

# Start app with PM2 in production mode
CMD ["pm2-runtime", "server.js", "--name", "email-backend"]
