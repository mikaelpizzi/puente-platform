FROM node:20-alpine AS builder
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . .
RUN pnpm install
# Variables Dummy para Prisma
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV AUTH_DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN cd apps/backend/auth-service && npx prisma generate
RUN pnpm --filter ./apps/backend/auth-service build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app .
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs
EXPOSE 3001
CMD ["node", "apps/backend/auth-service/dist/main.js"]