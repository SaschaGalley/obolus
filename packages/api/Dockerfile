FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.0.5 --activate

# Copy workspace files (incl. .npmrc for pnpm concurrency settings)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./

# Copy package files
COPY packages/api/package.json ./packages/api/

# Install dependencies. Concurrency tuning is done via .npmrc (see project
# root) rather than CLI flags — pnpm 11 rejects some flags at install time
# (exit 1) that older versions silently accepted.
RUN pnpm install --filter @obulus/api --frozen-lockfile

# Copy the rest
COPY packages/api ./packages/api

# Build the package
WORKDIR /app/packages/api
RUN pnpm run build

FROM node:20-alpine AS runner

WORKDIR /app/packages/api

RUN corepack enable && corepack prepare pnpm@11.0.5 --activate

# Install Chromium for Puppeteer PDF generation
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/packages/api/node_modules ./node_modules
COPY --from=builder /app/packages/api/package.json ./package.json
COPY --from=builder /app/packages/api/dist ./dist
COPY --from=builder /app/packages/api/src/pdf/templates ./dist/pdf/templates
COPY --from=builder /app/packages/api/migrations ./migrations

EXPOSE 3000

CMD ["sh", "-c", "pnpm migration:run:prod && pnpm start:prod"]
