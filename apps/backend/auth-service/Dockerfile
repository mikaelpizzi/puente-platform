FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile

# Generate Prisma Client (required for auth-service)
RUN cd apps/backend/auth-service && npx prisma generate

# Build the service
RUN pnpm --filter @puente/auth-service build

# Isolate production dependencies
RUN pnpm deploy --filter @puente/auth-service --prod /prod/app

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy dependencies and final build
COPY --from=builder /prod/app/node_modules ./node_modules
COPY --from=builder /prod/app/dist ./dist
COPY --from=builder /prod/app/package.json ./package.json

USER node
CMD ["node", "dist/main.js"]