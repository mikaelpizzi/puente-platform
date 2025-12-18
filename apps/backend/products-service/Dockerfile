FROM node:20-alpine AS builder
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Copy all source code
COPY . .

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build the service
RUN pnpm --filter @puente/products-service build

# --- RUNNER STAGE ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy everything from builder to guarantee no missing files
COPY --from=builder /app .

# Security user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

EXPOSE 3002
CMD ["node", "apps/backend/products-service/dist/main.js"]