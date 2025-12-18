FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile

RUN pnpm --filter @puente/products-service build
RUN pnpm deploy --filter @puente/products-service --prod /prod/app

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /prod/app/node_modules ./node_modules
# FIX: Ruta correcta
COPY --from=builder /app/apps/backend/products-service/dist ./dist
COPY --from=builder /prod/app/package.json ./package.json

USER node
CMD ["node", "dist/main.js"]