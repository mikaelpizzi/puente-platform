FROM node:20-alpine AS builder
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Copy all source code
COPY . .

# Install all dependencies
RUN pnpm install --frozen-lockfile

# --- PRISMA BLOCK (Required for auth-service) ---
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV AUTH_DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN cd apps/backend/auth-service && npx prisma generate
# ------------------------------------------------

# Build the service
RUN pnpm --filter @puente/auth-service build

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

EXPOSE 3001
CMD ["node", "apps/backend/auth-service/dist/main.js"]