FROM node:20-alpine AS builder

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy package files
COPY packages/web/package.json ./packages/web/

# Install dependencies
RUN pnpm install --filter @obulus/web --frozen-lockfile

# Copy the rest
COPY packages/web ./packages/web

# Build the package
WORKDIR /app/packages/web
RUN pnpm run build

FROM nginx:alpine AS runner

COPY --from=builder /app/packages/web/dist /usr/share/nginx/html
COPY packages/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
