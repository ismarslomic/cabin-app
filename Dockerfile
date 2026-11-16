# Base images are pinned by exact version and digest so every build is identical; Dependabot proposes
# updates. The Node version must equal .nvmrc exactly (CI checks this), so CI tests what ships.
FROM node:26.13.1-alpine@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5 AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# The Node image has no corepack: install the pnpm version pinned in "packageManager".
RUN npm install -g "pnpm@$(node -p "require('./package.json').packageManager.split('@')[1]")" \
    && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Runs as a non-root user and listens on 8080. TLS is terminated in front (Cloudflare Tunnel).
FROM nginxinc/nginx-unprivileged:1.31.7-alpine@sha256:b5047b9b76845eac124358373c6852377c52e4b05834a47647e955dd91cb8f1e
# The pinned base image is a snapshot. Install the Alpine security fixes released since, and remove curl,
# which nothing here uses (the health check uses wget). Then go back to the image's non-root user.
# Changing ALPINE_FIXES (CI passes the run id) busts the layer cache, so the upgrade runs on every build.
ARG ALPINE_FIXES=local
USER root
RUN echo "Alpine fixes build: ${ALPINE_FIXES}" && apk del --no-cache curl libcurl && apk upgrade --no-cache
USER 101
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1
