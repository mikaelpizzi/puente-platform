FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile

# FIX: Variables falsas para Prisma
ENV AUTH_DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

RUN cd apps/backend/auth-service && npx prisma generate

RUN pnpm --filter @puente/auth-service build
RUN pnpm deploy --filter @puente/auth-service --prod /prod/app

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /prod/app/node_modules ./node_modules
# FIX: Copiar 'dist' desde la ruta ORIGINAL
COPY --from=builder /app/apps/backend/auth-service/dist ./dist
COPY --from=builder /prod/app/package.json ./package.json

USER node
CMD ["node", "dist/main.js"]