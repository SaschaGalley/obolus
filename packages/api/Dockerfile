FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.0.5 --activate

# Copy workspace files (incl. .npmrc for pnpm concurrency settings)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./

# Copy package files
COPY packages/api/package.json ./packages/api/

# Install dependencies. Concurrency tuning via .npmrc.
# `--ignore-scripts` bypasses pnpm 11's strict postinstall-approval gate
# (it errors out on packages with build scripts unless explicitly whitelisted,
# and the whitelist in package.json/pnpm.onlyBuiltDependencies isn't reliably
# honored by pnpm 11.0.5 in workspace+filter mode). Safe here because all
# native deps we use (sharp@0.34+, esbuild@0.27+) ship prebuilt binaries via
# platform-specific optionalDependencies — no install-time compile step needed.
RUN pnpm install --filter @obulus/api --frozen-lockfile --ignore-scripts

# Copy the rest
COPY packages/api ./packages/api

# Build the package
WORKDIR /app/packages/api
RUN pnpm run build

FROM node:22-alpine AS runner

WORKDIR /app/packages/api

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

# Call node directly instead of via `pnpm run`. pnpm 11 added an automatic
# `runDepsStatusCheck` before script execution that internally calls
# `pnpm install` — which fails with ERR_PNPM_IGNORED_BUILDS on packages with
# postinstall scripts (sharp, esbuild, ...). We don't need pnpm at runtime
# at all — deps are already installed in the builder stage.
CMD ["sh", "-c", "node dist/database/migrate.js && node dist/main.js"]
