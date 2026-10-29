# Keep the Node major in sync with .nvmrc.
FROM node:26-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# The Node image has no corepack: install the pnpm version pinned in "packageManager".
RUN npm install -g "pnpm@$(node -p "require('./package.json').packageManager.split('@')[1]")" \
    && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Runs as a non-root user and listens on 8080. TLS is terminated in front (Cloudflare Tunnel).
FROM nginxinc/nginx-unprivileged:1.31-alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1
