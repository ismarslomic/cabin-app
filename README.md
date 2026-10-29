# Slomic Smarthytte

[![CI](https://github.com/ismarslomic/cabin-app/actions/workflows/ci.yml/badge.svg)](https://github.com/ismarslomic/cabin-app/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/ismarslomic/cabin-app/graph/badge.svg)](https://codecov.io/gh/ismarslomic/cabin-app)

Slomic Smarthytte: a mobile-first PWA for the cabin. The UI language is Norwegian Bokmål (`nb`). Built with React, TypeScript, Vite and Framework7.

Agents working in this repo should read `CLAUDE.md`; this README explains what each tool is for and why.

## Getting started

Requires Node 26 (see `.nvmrc`) and pnpm. With nvm, global packages are per Node version, so install pnpm once after installing Node 26 (`npm install -g pnpm`).

```sh
nvm use
pnpm install
pnpm dev
```

## Scripts

| Script                     | What it does                                                                                         |
| -------------------------- | ---------------------------------------------------------------------------------------------------- |
| `pnpm dev`                 | Start the Vite dev server                                                                            |
| `pnpm build`               | Type-check (`tsc -b`) and build                                                                      |
| `pnpm test`                | Run all tests once (Vitest)                                                                          |
| `pnpm test:watch`          | Run tests in watch mode                                                                              |
| `pnpm test:coverage`       | Run tests with a coverage report (`coverage/`)                                                       |
| `pnpm generate-pwa-assets` | Regenerate PWA icons from `public/favicon.svg`                                                       |
| `pnpm typecheck`           | Type-check only (`tsc -b`)                                                                           |
| `pnpm lint`                | Run oxlint (type-aware)                                                                              |
| `pnpm format`              | Format all files with oxfmt                                                                          |
| `pnpm format:check`        | Check formatting without writing                                                                     |
| `pnpm check`               | Everything CI would run: format check, lint, build (with type-check), tests. Run before every commit |
| `pnpm preview`             | Serve the production build locally                                                                   |

## Stack

| Tool                                                                                                                                                           | Why                                                                                               | Config                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| [React](https://react.dev/) 19 + [TypeScript](https://www.typescriptlang.org/docs/)                                                                            | UI and types                                                                                      | `tsconfig*.json`                              |
| [Vite](https://vite.dev/guide/)                                                                                                                                | Dev server and bundler                                                                            | `vite.config.ts`                              |
| [Framework7](https://framework7.io/react/) + framework7-react                                                                                                  | Mobile UI components (iOS/Material look), router, page transitions                                | `src/app/f7-setup.ts`, `src/app/f7-params.ts` |
| [lucide-react](https://lucide.dev/guide/packages/lucide-react)                                                                                                 | Icons as React SVG components, tree-shaken per icon                                               | imported where used                           |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) + [workbox-window](https://developer.chrome.com/docs/workbox)                                             | Web app manifest, service worker (Workbox `generateSW`), offline support, update prompt           | `VitePWA(...)` in `vite.config.ts`            |
| [@vite-pwa/assets-generator](https://vite-pwa-org.netlify.app/assets-generator/)                                                                               | Generates all PWA icons from one SVG                                                              | `pwa-assets.config.ts`                        |
| [Vitest](https://vitest.dev/guide/) + [jsdom](https://github.com/jsdom/jsdom)                                                                                  | Test runner (shares `vite.config.ts`) and simulated browser DOM                                   | `test` block in `vite.config.ts`              |
| [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/) + [`dom`](https://testing-library.com/docs/dom-testing-library/intro/) | Render components and query them like a user would (`dom` is a required peer dependency)          | `src/test/setup.ts`                           |
| [@testing-library/jest-dom](https://github.com/testing-library/jest-dom)                                                                                       | DOM matchers such as `toBeVisible()` and `toBeInTheDocument()`                                    | `src/test/setup.ts`                           |
| [@testing-library/user-event](https://testing-library.com/docs/user-event/intro/)                                                                              | Realistic user interaction (`await user.click(...)`)                                              | n/a                                           |
| [Docker](https://docs.docker.com/) + [nginx](https://nginx.org/en/docs/) (`nginx-unprivileged`)                                                                | Container image that serves the built app as static files, as a non-root user                     | `Dockerfile`, `nginx/`, `compose.yaml`        |
| [oxlint](https://oxc.rs/docs/guide/usage/linter)                                                                                                               | Linting                                                                                           | `.oxlintrc.json`                              |
| [oxlint-tsgolint](https://oxc.rs/docs/guide/usage/linter/type-aware)                                                                                           | Type-aware lint rules for oxlint (e.g. `no-floating-promises`), powered by the TypeScript Go port | `options.typeAware` in `.oxlintrc.json`       |
| [oxfmt](https://oxc.rs/docs/guide/usage/formatter)                                                                                                             | Formatting (Prettier-compatible, Rust)                                                            | `.oxfmtrc.json`                               |

## Framework7

- `framework7/lite-bundle` is the core for React; `Framework7.use(Framework7React)` registers the integration (`src/app/f7-setup.ts`, imported by `App.tsx`).
- The CSS (`framework7/css/bundle`) is imported in `src/styles/index.css`. The app mounts in `<div id="app">`.
- `src/app/f7-params.ts` holds the app parameters: name, `theme: 'auto'` (iOS look on iOS, Material elsewhere), `darkMode: 'auto'` (follows the system), routes and Norwegian texts.
- **Pages and routes.** A page is a component with `<Page>` at the root. Each feature exports its routes from `features/<name>/index.ts` (e.g. `homeRoutes`) and `app/routes.ts` collects them. Use `asyncComponent: () => import(...)` on a route to lazy-load a page.
- **Texts are Norwegian.** Framework7 has no locale files, so built-in texts are set per component through parameters (currently `dialog.buttonOk` and `dialog.buttonCancel`). Add the others (calendar, searchbar, etc.) when a feature uses them.
- Framework7 UI is built from its components (`Page`, `Navbar`, `Block`, `List`, ...); check the [React docs](https://framework7.io/react/) before writing custom UI.

## PWA

- **Manifest and service worker** are generated at build time by `vite-plugin-pwa` (`VitePWA(...)` in `vite.config.ts`). The manifest has the app name, `lang: 'nb'`, `theme_color` `#007aff` (must match the `theme-color` meta in `index.html`) and the icons. Every built file (about 1.5 MB) is precached, so the app works offline.
- **Updates use `registerType: 'prompt'`.** When a new version is deployed, `src/app/UpdatePrompt.tsx` shows a Framework7 toast ("Ny versjon er tilgjengelig" with an **Oppdater** button); the page reloads only when the user taps it, so nobody loses a half-filled form. It also shows "Appen fungerer nå uten nett" the first time the offline cache is ready. Changing between `prompt` and `autoUpdate` after going to production is painful, so decide deliberately.
- **Icons** come from one source, `public/favicon.svg` (a cabin glyph). Run `pnpm generate-pwa-assets` after editing it; it rewrites the PNGs and `favicon.ico` in `public/`, which are committed. The maskable and Apple icons get white padding automatically.
- **The PWA is off in `pnpm dev`** (`devOptions` is not enabled). To test it, run `pnpm build && pnpm preview`, then open Chrome DevTools > Application: _Manifest_ shows installability, _Service Workers_ shows the worker, and ticking _Offline_ then reloading proves the offline support.
- **`useCredentials: true`** puts `crossorigin="use-credentials"` on the manifest link. Browsers normally fetch the manifest without cookies, so behind Cloudflare Access it would be redirected to the login page and install would fail. It is harmless for same-origin requests, so it also works locally and in the container.
- Installing needs HTTPS in production (localhost is exempt) and the server must serve `manifest.webmanifest` as `application/manifest+json`.
- `virtual:pwa-register/react` is a virtual module; its types come from `vite-plugin-pwa/react` in `tsconfig.app.json`. In tests, mock it (see `UpdatePrompt.test.tsx`); in plain jsdom it registers nothing.

## Icons

- Import each icon by name where it is used: `import { House } from 'lucide-react'`. The package is tree-shaken, so only imported icons end up in the bundle (one icon cost about 3 kB raw, 1.5 kB gzipped, including lucide's small runtime). Never `import * as` the package or build icons from a name string, which would pull in everything.
- Icons draw with `currentColor`, so they follow Framework7's text, link and dark-mode colors. Do not hard-code colors.
- Size with the `size` prop (px). Icons are `aria-hidden` by default, which is right for decorative icons. An icon-only button needs an accessible name on the button, e.g. `<Link iconOnly aria-label="Innstillinger"><Settings /></Link>`.
- Framework7's own `<Icon>` (Framework7 Icons or Material Icons fonts) is not used. Lucide is the icon set.
- Browse icons at https://lucide.dev/icons.

## Testing

- Test files sit next to the code: `Foo.tsx` and `Foo.test.tsx`.
- Import `describe`, `it` and `expect` from `vitest` explicitly (globals are off).
- Query by role or label (`getByRole`, `getByLabelText`), not by CSS class or test id, unless there is no alternative.
- Use `userEvent.setup()` and `await user.click(...)`, not `fireEvent`.
- `src/test/setup.ts` registers the jest-dom matchers, cleans up after each test and stubs `window.matchMedia` (missing in jsdom, needed by Framework7).
- Render Framework7 trees inside `StrictMode` like `main.tsx` does (see `App.test.tsx`). Framework7 pages render asynchronously, so use `findBy*` queries.
- `src/test/setup.test.tsx` is a smoke test of the tooling itself. Keep it so a broken setup is obvious.

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request and on pushes to `main`: install with the frozen lockfile, format check, lint, build (with type-check) and tests with coverage. It is the same as `pnpm check`, with coverage on, followed by an upload of `coverage/lcov.info` to [Codecov](https://codecov.io/gh/ismarslomic/cabin-app) (the `CODECOV_TOKEN` repository secret; a failed upload fails the build). Node comes from `.nvmrc` and the pnpm version from `packageManager` in `package.json`, so CI and your machine use the same versions. `codecov.yml` sets the pull request checks: total coverage may drop at most 2 points, and the lines changed in a PR are compared against the project average. Coverage settings are in the `test.coverage` block of `vite.config.ts`: Vitest 5 only reports files that tests import unless `include` is set, and it excludes nothing by default, so tests, test setup and `main.tsx` are excluded explicitly.

## Docker

The app is deployed as a container on a Raspberry Pi 5 (`linux/arm64`, a single architecture on purpose).

- **`Dockerfile`:** two stages. A Node stage runs `pnpm build`; the final stage is `nginxinc/nginx-unprivileged` serving `dist/` on port **8080** as a non-root user. Both base images are pinned by **exact version and digest** (`node:26.13.0-alpine@sha256:…`), so a rebuild never silently picks up a different Node, nginx or Alpine. Updates are proposed by Dependabot and verified by CI; to bump by hand, pull the new tag and copy the digest it prints. The Node version must equal `.nvmrc` exactly; CI fails if they differ, so the Node that CI tests is the Node that ships. When Dependabot bumps the Dockerfile, bump `.nvmrc` (and `@types/node`) in the same PR. The Node image has no corepack, so pnpm is installed with npm using the version from `packageManager`.
- **`nginx/default.conf`:** exists because a PWA needs specific headers. `sw.js`, the Workbox runtime, `manifest.webmanifest` and the HTML are `no-cache`, otherwise users get stuck on an old version. Hashed files in `/assets/` are cached for a year (`immutable`, success responses only). `manifest.webmanifest` is served as `application/manifest+json`. Unknown paths fall back to `index.html`. `/healthz` is used by the container health check.
- **Hardening:**
  - nginx runs as a non-root user, hides its version (`server_tokens off`) and sends security headers from `nginx/security-headers.conf`: `nosniff`, `Referrer-Policy`, `X-Frame-Options`, a `Permissions-Policy` that denies camera, microphone, location, payment and USB (to use one, allow it for the app's own origin by changing that one directive, e.g. `geolocation=(self)`, instead of removing the header), and a **Content-Security-Policy** that only allows the app's own origin (`style-src` also allows inline styles because Framework7 sets them). **When the app starts calling an external API or loading images or fonts from another origin, add that origin to `connect-src`, `img-src` or `font-src`**, otherwise the browser blocks it. Every nginx `location` that uses `add_header` must include the snippet, because `add_header` is not inherited.
  - `compose.yaml` runs the container with a read-only filesystem, all capabilities dropped, `no-new-privileges` and `unless-stopped`.
  - HSTS is not set here: the container only speaks HTTP, and HTTPS is handled by Cloudflare, so enable HSTS in the Cloudflare dashboard if you want it.
- **No host port.** The container is only reachable from other containers on the Docker network `cloudflared`, where the Cloudflare Tunnel container runs. In the tunnel's public hostname settings, set the service to `http://cabin-app:8080`. Create the network once with `docker network create cloudflared`, or set `name:` in `compose.yaml` to the network your tunnel already uses (and attach `cloudflared` to it).
- **HTTPS** is terminated by the Cloudflare Tunnel. The service worker and PWA install only work over HTTPS (or `localhost`), so always open the app through the tunnel address.
- **Authentication** is [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/) in front of the tunnel hostname, configured in Cloudflare, not in this repo. The app itself has no login, so never expose the container another way.

Try the image locally (it publishes a port, unlike `compose.yaml`):

```sh
docker build -t cabin-app .
docker run --rm -p 8080:8080 cabin-app     # http://localhost:8080
```

On the Pi: `docker network create cloudflared` (once), then `docker compose pull && docker compose up -d`, optionally pinning a version with `CABIN_APP_VERSION=1`.

## Editor setup (IntelliJ IDEA)

1. Install the [Oxc plugin](https://plugins.jetbrains.com/plugin/27061-oxc) (Settings > Plugins > Marketplace > "Oxc"). It runs the project's own `oxfmt` and `oxlint`, so run `pnpm install` first.
2. In the plugin's settings (search for "Oxfmt" and "Oxlint" in Settings), enable formatting on save, and optionally fix-on-save for lint.

Only `.idea/externalDependencies.xml` is committed (it was force-added with `git add -f`, because a global gitignore may exclude `.idea/`). It marks the Oxc plugin as required, so IntelliJ prompts to install it when the project is opened. The format-on-save settings themselves are per machine (not stored in `.idea/`), and `pnpm format:check` is the source of truth.

## Folder structure

Code is grouped by **feature**, not by technical layer.

```
src/
├── main.tsx      # entry point
├── app/          # app shell and wiring only (App, Framework7 params and setup, routes)
├── features/     # one folder per feature: pages, components, hooks, api, tests
├── shared/       # used by 2+ features, feature-agnostic
└── styles/       # global and theme styling only
```

Rules:

1. A feature owns its pages, components, hooks, API calls and tests.
2. Features import from `shared/`, never from another feature's internals (use its `index.ts`).
3. Nothing goes in `shared/` until a second feature needs it.
4. `app/` only wires things together; features never import from `app/`.
5. Tests sit next to the code they test.

The `@/` alias maps to `src/` (`vite.config.ts` and `tsconfig.app.json`), e.g. `import App from '@/app/App.tsx'`.

## Gotchas and decisions

- **Language:** Norwegian Bokmål (`nb`) is set in three places: `lang="nb"` in `index.html`, `lang: 'nb'` in the PWA manifest, and the Framework7 texts in `f7-params.ts`.
- **oxfmt config:** `semi: false` and `singleQuote: true` differ from oxfmt's defaults (semicolons, double quotes); they match the code style the project started with. oxfmt also formats Markdown and JSON, so `pnpm format` touches `README.md` and `package.json` too.
- **Node 26:** LTS since 2026-10-28 and supported by every tool in the stack. Pinned to an exact version in `.nvmrc` (and `engines` requires 26+). `nvm use` needs that exact version installed; `nvm install` fetches it. Bump `@types/node` together with Node: types should match the Node version in use, not the newest release.
- **Bundle size:** `framework7/lite-bundle` includes every Framework7 component, so production JS is about 1 MB (278 kB gzipped) and the Framework7 CSS about 500 kB (73 kB gzipped). That is fine for a PWA cached after the first visit (each file is under Workbox's 2 MiB precache limit). Framework7's custom build / lazy modules can shrink both if first-load time ever matters.
- **Viewport:** the Framework7 docs suggest `maximum-scale=1, user-scalable=no`; we keep pinch-zoom enabled for accessibility and use `width=device-width, initial-scale=1, viewport-fit=cover`.
- **Routing:** the router uses in-memory history. Real URLs (`browserHistory`) need the server and service worker to fall back to `index.html`; the generated worker already does (`navigateFallback`), so it can be switched on when deep links matter.
- **No `robots.txt`:** the PWA docs list one among the minimal requirements, but this is a private family app that does not need to be crawled.
- **Cloudflare Access and AJAX:** when an Access session expires, requests from the page get a redirect to the Cloudflare login, which the browser reports as a CORS error. Cloudflare's [session management docs](https://developers.cloudflare.com/cloudflare-one/access-controls/access-settings/session-management/#ajax) say to send `X-Requested-With: XMLHttpRequest` on AJAX requests to get a clear `401` instead. That is a request header, so it is set by the app's code, not by nginx. Once the app makes its first API call, send all requests through one shared helper that adds the header and shows a "session expired, reload" message on `401`.
