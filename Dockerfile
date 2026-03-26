# Build stage
FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve stage — lightweight static file server, no nginx
FROM node:24-alpine
RUN npm install -g serve@14 && adduser -D -u 1001 appuser
WORKDIR /app
COPY --from=builder /app/dist ./dist
USER appuser

EXPOSE 3001

CMD ["serve", "dist", "-l", "tcp://0.0.0.0:3001", "-s"]
