# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
WORKDIR /repo
ENV PNPM_HOME="/repo/.pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV HUSKY=0
RUN apk add --no-cache libc6-compat python3 make g++ \
    && corepack enable

FROM base AS builder
ARG SERVICE_NAME=@puente/auth-service
ARG SERVICE_PATH=apps/backend/auth-service
ARG SERVICE_PORT=3001
COPY . .
RUN pnpm install --filter ${SERVICE_NAME}... --frozen-lockfile
RUN pnpm --filter ${SERVICE_NAME}... build
RUN pnpm deploy --filter ${SERVICE_NAME}... --prod /opt/app
RUN cp -r ${SERVICE_PATH}/dist /opt/app/dist

FROM node:20-alpine AS runner
ARG SERVICE_PORT=3001
ENV NODE_ENV=production
ENV PORT=${SERVICE_PORT}
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY --from=builder /opt/app ./
EXPOSE ${SERVICE_PORT}
CMD ["node", "dist/main.js"]