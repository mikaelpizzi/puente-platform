FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile

# Build the service
RUN pnpm --filter @puente/logistics-service build

# Isolate production dependencies
RUN pnpm deploy --filter @puente/logistics-service --prod /prod/app

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy dependencies and final build
COPY --from=builder /prod/app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/logistics-service/dist ./dist
COPY --from=builder /prod/app/package.json ./package.json

USER node
CMD ["node", "dist/main.js"]