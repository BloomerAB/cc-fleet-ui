# Build stage
FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve stage — lightweight static file server, no nginx
FROM node:24-alpine
RUN npm install -g serve@14
WORKDIR /app
COPY --from=builder /app/dist ./dist

EXPOSE 3001

# serve with SPA fallback, listen on all interfaces
CMD ["serve", "dist", "-l", "3001", "-s"]
