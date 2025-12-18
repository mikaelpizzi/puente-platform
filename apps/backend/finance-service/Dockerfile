FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile

# FIX: Variables falsas para que 'prisma generate' no falle al leer la config
ENV FINANCE_DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Generar Prisma
RUN cd apps/backend/finance-service && npx prisma generate

# Build y Deploy
RUN pnpm --filter @puente/finance-service build
RUN pnpm deploy --filter @puente/finance-service --prod /prod/app

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copiar dependencias limpias
COPY --from=builder /prod/app/node_modules ./node_modules
# FIX: Copiar 'dist' desde la ruta ORIGINAL de construcción
COPY --from=builder /app/apps/backend/finance-service/dist ./dist
COPY --from=builder /prod/app/package.json ./package.json

USER node
CMD ["node", "dist/main.js"]