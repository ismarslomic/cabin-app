# Base images are pinned by exact version and digest so every build is identical; Dependabot proposes
# updates. Keep the Node major equal to .nvmrc.
FROM node:26.13.0-alpine@sha256:c6ad9e9c1d80f6eb607c26b4b0a132ff7a2344fad1c78ea3baa2a7d4c8de6d94 AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# The Node image has no corepack: install the pnpm version pinned in "packageManager".
RUN npm install -g "pnpm@$(node -p "require('./package.json').packageManager.split('@')[1]")" \
    && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Runs as a non-root user and listens on 8080. TLS is terminated in front (Cloudflare Tunnel).
FROM nginxinc/nginx-unprivileged:1.31.7-alpine@sha256:b5047b9b76845eac124358373c6852377c52e4b05834a47647e955dd91cb8f1e
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1
