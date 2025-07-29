FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm install -g pm2 && npm install

# Copy application files
COPY . .

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/ || exit 1

EXPOSE 5000

CMD ["pm2-runtime", "server.js", "--name", "email-backend"]
