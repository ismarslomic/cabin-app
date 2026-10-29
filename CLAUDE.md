# cabin-app

Slomic Smarthytte: mobile-first PWA (React 19, TypeScript, Vite). UI text is Norwegian Bokmål (`nb`); code, comments and docs are English. See `README.md` for what each tool is for.
This file overrides the global Kotlin/Gradle instructions: this is a **pnpm** project.

## Commands

- Node 26, exact version in `.nvmrc`. Run `nvm use` in a new shell first (`source ~/.nvm/nvm.sh && nvm use`).
- Package manager: `pnpm` only. Never npm or yarn.
- `pnpm dev`, `pnpm test` (Vitest, once) / `pnpm test:watch`, `pnpm typecheck`, `pnpm lint` (type-aware via oxlint-tsgolint), `pnpm build` (includes type-check).
- Handle promises: await them, or mark with `void`. `no-floating-promises` is an error.
- `pnpm format` writes formatting (oxfmt); `pnpm format:check` verifies it. Do not hand-format.
- `pnpm test:coverage` shows coverage (`coverage/` is git-ignored). CI (`.github/workflows/ci.yml`) runs the same steps as `pnpm check` plus coverage, and uploads it to Codecov (`codecov.yml` holds the PR check rules).
- **`pnpm check` before every commit** (format check, lint, build, tests). Run `pnpm format` first if it reports formatting. Fix failures before committing.

## Structure

Group by feature, not by technical layer. Full rules in `README.md` ("Folder structure").

- `src/app/`: wiring only. `src/features/<name>/`: pages, components, hooks, api, tests.
- `src/shared/`: only when 2+ features need it. `src/styles/`: global styling only.
- Features never import another feature's internals, and never import from `app/`.
- Use the `@/` alias for `src/`, not `../../..`.
- Tests sit next to the code (`Foo.test.tsx`). Import `describe`/`it`/`expect` from `vitest` (no globals). Query by role/label, use `userEvent`, not `fireEvent`. Write or update a test with every feature change.

## Framework7

- UI is Framework7 React (`framework7-react`) on top of `framework7/lite-bundle`. Use its components (`Page`, `Navbar`, `Block`, `List`, ...), not custom HTML/CSS, and check https://framework7.io/react/ for the API.
- A page component has `<Page>` at the root and lives in `features/<name>/pages/`. Each feature exports its routes in `features/<name>/index.ts`; `app/routes.ts` collects them.
- App parameters live in `app/f7-params.ts`. Framework7 has no locale files: set built-in Norwegian texts through component parameters.
- Tests that render Framework7 need `matchMedia` (stubbed in `src/test/setup.ts`), `StrictMode`, and async `findBy*` queries.

## PWA

- Config in `vite.config.ts` (`VitePWA`), update toast in `src/app/UpdatePrompt.tsx`. Update strategy is `prompt`: never auto-reload the page.
- Icons are generated: edit `public/favicon.svg`, run `pnpm generate-pwa-assets`, commit the PNGs. Keep `theme_color` in the manifest equal to the `theme-color` meta in `index.html`.
- The service worker only exists in a production build. Test PWA changes with `pnpm build && pnpm preview`, not `pnpm dev`.
- Mock `virtual:pwa-register/react` in tests that need update/offline states.

## Docker

- `Dockerfile` (build with Node, serve with `nginx-unprivileged` on 8080), `nginx/`, `compose.yaml`. Target is a Raspberry Pi 5 (`linux/arm64` only). TLS is done by a Cloudflare Tunnel container on the shared `cloudflared` Docker network; the app has no host port.
- Base images are pinned by exact version and digest. Never change them to a floating tag like `node:26`. To bump, pull the new tag, copy the digest, change tag and digest together. The Node version in the `Dockerfile` must equal `.nvmrc` exactly (a CI step checks it); bump both together. There is no corepack in the Node image; pnpm is installed from `packageManager`.
- Do not weaken the nginx caching rules: `sw.js`, `workbox-*.js`, `manifest.webmanifest` and HTML must stay `no-cache`; only `/assets/` is immutable (and without `always`, so errors are not cached). A new nginx `location` that uses `add_header` must include `security-headers.conf`.
- The Content-Security-Policy in `nginx/security-headers.conf` allows only the app's own origin. A feature that calls an external API or loads external images or fonts must add that origin to `connect-src`, `img-src` or `font-src`, or the browser will silently block it.
- The `Permissions-Policy` denies camera, microphone, location, payment and USB. To let a feature use one, allow only our own origin for that single directive (e.g. `geolocation=(self)`); do not delete the header.
- Authentication is Cloudflare Access in front of the tunnel (not in this repo). All HTTP requests the app makes (`fetch`) must go through one shared helper (create it in `shared/lib/` with the first API call) that sends `X-Requested-With: XMLHttpRequest`, so an expired Access session gives a `401` to handle instead of a login redirect. This is a request header set in code; nginx cannot add it.
- After changing the Dockerfile or nginx config, build and run the image and check headers with `curl -I`; the PWA offline behaviour and CSP violations are what break silently.

## Icons

- Use `lucide-react` only; import each icon by name (`import { House } from 'lucide-react'`). Never `import *` or look icons up by string, which breaks tree-shaking.
- No hard-coded colors (icons use `currentColor`). Icon-only controls need an `aria-label` on the control.

## Adding a feature

1. Create `src/features/<name>/` with `pages/`, `components/`, `hooks/`, `api/` only as needed.
2. Pages: `<Page>` at the root, Framework7 components inside, Norwegian UI text, `lucide-react` icons.
3. Export the routes from `features/<name>/index.ts` and add them to `src/app/routes.ts`.
4. Write tests next to the code. Run `pnpm check`.
5. Update `README.md` if the feature adds a tool, a convention or a gotcha.

## Workflow

- Small, focused commits; end commit messages with the Co-Authored-By line. Never force push.
- Match existing style. Do not reformat files you did not touch.
- Check the library's current docs before configuring it; do not rely on memory.
- New dependency: add it with `pnpm add`, document what it is for in the `README.md` Stack table and any rules in this file, in the same commit.
