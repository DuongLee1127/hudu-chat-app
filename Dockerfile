# Stage 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install all workspace dependencies
RUN npm install

# Copy the remaining project files
COPY . .

# Set build-time environments
ENV NEXT_PUBLIC_SOCKET_URL=/
ENV API_PORT=3001
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Compile applications
RUN npm run build --workspace=api
RUN npm run build --workspace=web

# Stage 2: Runner stage
FROM node:22-alpine AS runner

# Install shell utils for process check and control
RUN apk add --no-cache bash curl

WORKDIR /app

# Set production environments
ENV NODE_ENV=production
ENV PORT=7860
ENV API_PORT=3001
ENV NEXT_TELEMETRY_DISABLED=1

# Copy build output and dependencies with correct non-root permissions (node:node is UID/GID 1000)
COPY --from=builder --chown=node:node /app ./

# Standard Hugging Face Space runs on non-root UID 1000
USER node

# Expose Space port
EXPOSE 7860

# Start deployment using start script with bash explicitly
CMD ["bash", "./start.sh"]
