FROM node:20-alpine AS builder
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Copy all source code
COPY . .

# Install all dependencies
RUN pnpm install --frozen-lockfile

# --- PRISMA BLOCK (Required for finance-service) ---
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV FINANCE_DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN cd apps/backend/finance-service && npx prisma generate
# ---------------------------------------------------

# Build the service
RUN pnpm --filter @puente/finance-service build

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

EXPOSE 3003
CMD ["node", "apps/backend/finance-service/dist/main.js"]