FROM node:22-alpine AS builder

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.0.5 --activate

# Copy workspace files (incl. .npmrc for pnpm concurrency settings)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./

# Copy package files
COPY packages/web/package.json ./packages/web/

# Install dependencies. `--ignore-scripts` bypasses pnpm 11's strict
# postinstall-approval gate — esbuild 0.27+ ships prebuilt binaries via
# platform-specific subpackages so no install-time compile is needed.
# See packages/api/Dockerfile for the full reasoning.
RUN pnpm install --filter @obulus/web --frozen-lockfile --ignore-scripts

# Copy the rest
COPY packages/web ./packages/web

# Build the package
WORKDIR /app/packages/web
RUN pnpm run build

FROM nginx:alpine AS runner

COPY --from=builder /app/packages/web/dist /usr/share/nginx/html
COPY --from=builder /app/packages/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
