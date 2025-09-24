# Stage: Base
FROM node:lts-alpine AS base

WORKDIR /app

RUN apk update && apk add bash curl openssl

RUN npm install -g pnpm

# Stage: Builder
FROM base AS builder

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/

RUN pnpm install -r --frozen-lockfile

COPY . .

# Stage: Backend Builder
FROM builder AS backend-builder

ARG PNPM_SCOPE
ARG SERVICE_NAME

RUN pnpm --filter ${PNPM_SCOPE}/${SERVICE_NAME} build:app

# Stage: Web Builder
FROM builder AS web-builder

ARG PNPM_SCOPE
ARG SERVICE_NAME

ARG DATABASE_URL="https://example.com"
ARG NEXTAUTH_SECRET="dummy"
ARG NEXTAUTH_URL="https://example.com"
ARG TWITCH_APP_CLIENT_ID="dummy"
ARG TWITCH_APP_CLIENT_SECRET="dummy"
ARG NEXT_PUBLIC_RPC_URL="https://api.binglow.app"
ARG NEXT_PUBLIC_WS_URL="wss://ws.binglow.app"

ENV DATABASE_URL=${DATABASE_URL}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV TWITCH_APP_CLIENT_ID=${TWITCH_APP_CLIENT_ID}
ENV TWITCH_APP_CLIENT_SECRET=${TWITCH_APP_CLIENT_SECRET}
ENV NEXT_PUBLIC_RPC_URL=${NEXT_PUBLIC_RPC_URL}
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}

RUN pnpm --filter ${PNPM_SCOPE}/${SERVICE_NAME} build:app

# Runner: Backend Services
FROM base AS backend-runner-base

ARG SERVICE_NAME

COPY --from=backend-builder /app/packages/${SERVICE_NAME}/dist .
COPY --from=backend-builder /app/packages/prisma/src/generated/client /app/src/generated/client

RUN pnpm install --prod

HEALTHCHECK --interval=30s --retries=3 --start-period=15s --timeout=10s \
    CMD [ "pnpm", "healthcheck" ]

CMD ["pnpm", "start"]

# Target: Bot Auth Service
FROM backend-runner-base AS bot-auth-service

# Target: Bot Service
FROM backend-runner-base AS bot-service

# Target: Game Service
FROM backend-runner-base AS game-service

EXPOSE 3000

# Target: API/RPC Service
FROM backend-runner-base AS rpc-service

EXPOSE 3000

# Target: Web Service
FROM base AS web-service

WORKDIR /app

ENV HOSTNAME=0.0.0.0

COPY --from=web-builder /app/packages/web-service/.next/standalone ./
COPY --from=web-builder /app/packages/web-service/.next/static ./packages/web-service/.next/static
COPY --from=web-builder /app/packages/prisma/src/generated/client ./packages/web-service/src/generated/client

HEALTHCHECK --interval=30s --retries=3 --start-period=15s --timeout=10s \
    CMD [ "/bin/sh", "-c", "curl -f http://localhost:3000/api/ping || exit 1"]

EXPOSE 3000

CMD [ "node", "./packages/web-service/server.js" ]
