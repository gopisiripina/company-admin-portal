# Stage 1: Build
FROM node:18 AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .

ENV NODE_ENV=production
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
