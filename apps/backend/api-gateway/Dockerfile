FROM node:20-alpine AS builder
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . .
RUN pnpm install
# FIX: Usar ruta relativa para asegurar que encuentre el proyecto
RUN pnpm --filter ./apps/backend/api-gateway build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app .
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs
EXPOSE 3000
CMD ["node", "apps/backend/api-gateway/dist/main.js"]