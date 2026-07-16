# ==========================
# Stage 1 - Dependencies
# ==========================
FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN npm ci

# ==========================
# Stage 2 - Build
# ==========================
FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build --workspace=api
RUN npm run build --workspace=web

# ==========================
# Stage 3 - Runtime
# ==========================
FROM node:22-alpine

RUN apk add --no-cache bash curl

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=7860
ENV API_PORT=5000
ENV NEXT_TELEMETRY_DISABLED=1

# Root files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# API
COPY --from=builder /app/apps/api ./apps/api

# WEB
COPY --from=builder /app/apps/web .//apps/web

# Startup script
COPY --from=builder /app/start.sh ./start.sh

RUN chmod +x start.sh

EXPOSE 7860

CMD ["bash", "./start.sh"]