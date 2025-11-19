# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS builder
WORKDIR /repo
ENV PNPM_HOME="/repo/.pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV HUSKY=0
RUN apk add --no-cache libc6-compat python3 make g++ \
    && corepack enable
COPY . .
RUN pnpm install --filter @puente/pwa... --frozen-lockfile
RUN pnpm --filter @puente/pwa... build

FROM nginx:1.27-alpine AS runner
ARG SERVICE_PORT=4173
ENV NODE_ENV=production
COPY apps/frontend/pwa/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /repo/apps/frontend/pwa/dist /usr/share/nginx/html
EXPOSE ${SERVICE_PORT}
CMD ["nginx", "-g", "daemon off;"]