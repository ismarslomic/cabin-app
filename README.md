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
| [Docker](https://docs.docker.com/) + [nginx](https://nginx.org/en/docs/) (`nginx-unprivileged`)                                                                | Container image that serves the built app as static files, as a non-root user                     | `Dockerfile`, `nginx/`, `docker-compose.yml`  |
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
  - `docker-compose.yml` runs the container with a read-only filesystem, all capabilities dropped, `no-new-privileges` and `unless-stopped`.
  - HSTS is not set here: the container only speaks HTTP, and HTTPS is handled by Cloudflare, so enable HSTS in the Cloudflare dashboard if you want it.
- **No host port.** The container is only reachable from other containers on the external Docker network `cabin-visits-shared`, which the Cloudflare Tunnel container is also on. In the tunnel's public hostname settings, set the service to `http://cabin-app:8080` (Docker resolves the container name on that network). The network must already exist; `docker-compose.yml` does not create it.
- **HTTPS** is terminated by the Cloudflare Tunnel. The service worker and PWA install only work over HTTPS (or `localhost`), so always open the app through the tunnel address.
- **Authentication** is [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/) in front of the tunnel hostname, configured in Cloudflare, not in this repo. The app itself has no login, so never expose the container another way.

Try the image locally (it publishes a port, unlike `docker-compose.yml`):

```sh
docker build -t cabin-app .
docker run --rm -p 8080:8080 cabin-app     # http://localhost:8080
```

`docker-compose.yml` is the file that runs on the Pi, copied as it is; the Pi does not need this repository. It never builds anything, it pulls `ghcr.io/ismarslomic/cabin-app` from the registry. It also carries [Diun](https://crazymax.dev/diun/) labels, so Diun notifies you when a new release `X.Y.Z` is published. To deploy a release, change the image tag in the file (in the repo and on the Pi) and run `docker compose pull && docker compose up -d`.

## Releasing the Docker image

`.github/workflows/docker.yml` builds the image on a **native arm64 runner** (`ubuntu-24.04-arm`, no emulation, since the Pi 5 is arm64) and scans it with [Trivy](https://trivy.dev/):

- **Pull requests and pushes to `main`:** build and scan only. Nothing is published, so the Pi can never pick up a half-finished change.
- **A GitHub Release is published:** build, scan, then push to `ghcr.io/ismarslomic/cabin-app`. The scan runs _before_ the push, so a vulnerable image never reaches the registry.
- **The scan fails the build** on any HIGH or CRITICAL vulnerability that has a fix available (OS packages and libraries). Unfixed ones are ignored because nobody can act on them. Read the table in the log of the failed step. The usual fix is to update the base image (see _Updating dependencies_); do not lower the severity or add ignores without a comment explaining why. The Trivy action is pinned to a commit rather than a tag, because it is a third-party security tool and tags can be moved.
- **The final image is patched at build time.** The pinned nginx base image is a snapshot, so the `Dockerfile` runs `apk upgrade` to install Alpine security fixes released since, and removes `curl`/`libcurl`, which nothing uses (the health check uses `wget`). The first scan found fixable HIGH/CRITICAL issues in `brotli-libs` and `curl` that way. The base image stays pinned by digest; only OS fixes are pulled in, which is why two builds of the same commit can differ slightly.

### Tags

The tag is the release tag without the `v`, plus shorter forms. The compose file uses the exact one; the shorter ones exist so you can follow a minor or major version without ever getting a breaking change:

| Release                     | Image tags                                                                       |
| --------------------------- | -------------------------------------------------------------------------------- |
| `v1.4.2`                    | `1.4.2`, `1.4`, `1`, `latest`                                                    |
| `v0.1.0`                    | `0.1.0`, `0.1`, `latest` (there is no `0` tag: `0.x` makes no stability promise) |
| `v1.5.0-rc.1` (pre-release) | `1.5.0-rc.1` only                                                                |

### Making a release

```sh
gh release create v0.2.0 --target main --title v0.2.0 --generate-notes
```

(or use the GitHub UI; add `--prerelease` for a release candidate). The tag must be `v` plus a semantic version. Releases created by a workflow with the default `GITHUB_TOKEN` do not trigger other workflows, so create them yourself or with a personal access token. Versioning: patch for fixes, minor for features, major for anything that needs action on the Pi (a changed compose file, network or tunnel setup). Stay on `0.x` until the first real feature runs on the Pi, then release `1.0.0`.

The Pi pins an **exact** version in `docker-compose.yml`, so nothing changes until you decide it should. To roll back, put the older version in the image tag and run `docker compose up -d` again. If you would rather follow every release of a major version automatically, use the `1` tag instead of `1.4.2`. Diun reports only exact `X.Y.Z` tags either way.

The image is **public** in GHCR, so the Pi pulls it without logging in (checked for `v0.1.0` with an anonymous token). If `docker pull` ever says `unauthorized`, open the package's settings on GitHub (profile > Packages > `cabin-app` > Package settings) and check the visibility.

In the registry you will see two entries per tag: `linux/arm64` (the image) and `unknown/unknown`, which is the build provenance attestation, not a second platform.

### Normal start-up log lines

The nginx base image runs some start-up scripts, and `docker compose logs` shows one line that looks like a problem but is not: `10-listen-on-ipv6-by-default.sh: info: can not modify /etc/nginx/conf.d/default.conf (read-only file system?)`. The container is read-only on purpose and our own config already says what to listen on (IPv4, port 8080), so there is nothing to change. nginx starts one worker per CPU core (four on the Pi 5).

## Updating dependencies

Dependabot opens pull requests for updates (next section); updating by hand follows the same steps, so this chapter is also the checklist for reviewing those PRs. One kind of update per commit, so a regression is easy to bisect and revert.

### Dependabot

`.github/dependabot.yml` checks **npm (pnpm), Docker base images and GitHub Actions** every Monday at 06:00 (Oslo time) and opens pull requests titled `chore(deps): bump …`. CI and the Docker workflow run on each PR. _Security_ updates and vulnerability alerts are separate repository settings (enabled), not part of that file, and they ignore the cooldown below.

- **Groups.** Packages that must move together, major versions included, arrive as one PR: `framework7`, `react`, `vitest`, `oxc`, `testing-library`, `pwa` and `vite` (see the table below for what is in each). Everything else is one `minor-and-patch` PR per week; other major updates arrive as one PR each so you can read their release notes. All GitHub Actions minor and patch updates are one PR.
- **Ignored on purpose.** `@types/node` majors (they follow Node, see _Node_ below), and major versions of the `node` and `nginx-unprivileged` images (a deliberate upgrade, see _Node_ and _Docker base images_).
- **Cooldown.** A new release waits 3 days (7 days for an npm major) before Dependabot proposes it, so a broken or compromised release has time to be pulled. pnpm has its own, separate release-age setting (see step 1 below).
- **No PR is normal.** The first run, on 2026-10-30, opened none: everything was current, and `lucide-react` 1.64.0 was still inside its cooldown.

Reviewing a PR: read the release notes in the PR description, check that CI and the Docker scan are green, then follow the checklist below for what the group needs (for example the visual check for `framework7`, `vite` and `pwa`). To test locally: `gh pr checkout <number>`, `pnpm install`, `pnpm check`. You can steer Dependabot from a PR comment: `@dependabot rebase`, `@dependabot recreate`, or `@dependabot ignore this major version`.

- **A `node` image PR fails CI on purpose.** The check "Dockerfile Node version matches .nvmrc" fails until `.nvmrc` has the same version. Check out the PR branch, put the new version in `.nvmrc`, commit and push to the branch; then CI passes. For a Node _major_, follow _Node_ below instead.
- **Check the Docker diff.** The base images are pinned by tag and digest. Dependabot should change both in the same `FROM` line; if only one changed, fix it by hand.
- **Merging is not releasing.** Dependency updates only reach the Pi when you make a release (see _Releasing the Docker image_) and bump the tag in `docker-compose.yml`.

### npm packages

1. **See what is outdated:** `pnpm outdated`. An empty result means nothing newer is on offer. Very new releases can be held back by pnpm's supply-chain settings (see `minimumReleaseAge` in the [pnpm settings](https://pnpm.io/settings)): while writing this, lucide-react 1.64.0, published about 16 hours earlier, was not offered while 1.63.0 was. If an expected version is missing, check its publish date with `pnpm view <package> time.<version>` and try again later.
2. **Update.** Patch and minor versions within the `^` ranges: `pnpm update`. Major versions: `pnpm update --interactive --latest` (pick packages, ranges in `package.json` are rewritten), or name them: `pnpm update <package> <package> --latest`.
3. **Read the release notes** of anything that jumped a major version, before running the checks.
4. **Run `pnpm check`** (format check, lint, build with type-check, tests). If it only complains about formatting after an oxfmt update, run `pnpm format` and commit that on its own, as a formatting-only commit.
5. **Look at the app** if a UI, PWA or build package changed: `pnpm build && pnpm preview`, then open it and check the home page in light and dark mode, and in DevTools > Application that the service worker activates and the app still works when _Offline_ is ticked. The Docker workflow builds and scans the image on every push but does not run it, so for Framework7, Vite or PWA updates also build and run it as described under _Docker base images_, step 4.
6. **Commit `package.json` and `pnpm-lock.yaml` together.**

Packages that must move together, or need extra care:

| Package(s)                                                  | Rule                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `framework7` + `framework7-react`                           | Always the same version. Read the [Framework7 release notes](https://github.com/framework7io/framework7/releases) and migration guide: parameter names, CSS classes and the `framework7/lite-bundle` import path have changed between majors. After updating, check the UI visually (iOS and Material look, dark mode), that routing and the toast still work, and the bundle sizes in the build output. |
| `vitest` + `@vitest/coverage-v8`                            | Exactly the same version, or Vitest refuses to run coverage. `pnpm update vitest @vitest/coverage-v8 --latest`. Check the peer ranges of `jsdom` and Vite (`pnpm view vitest peerDependencies`).                                                                                                                                                                                                         |
| `oxlint` + `oxlint-tsgolint` + `oxfmt`                      | Update together. A new oxlint can need a newer `oxlint-tsgolint` (and the TypeScript Go port it follows); a new oxfmt can reformat files, and `README.md` and `package.json` count too.                                                                                                                                                                                                                  |
| `vite`, `@vitejs/plugin-react`, `vite-plugin-pwa`, `vitest` | Before a Vite major, check that the others declare support: `pnpm view vite-plugin-pwa peerDependencies` and the same for `vitest`. Update Vite last.                                                                                                                                                                                                                                                    |
| `vite-plugin-pwa` + `workbox-window`                        | `workbox-window` must satisfy the plugin's peer range (`pnpm view vite-plugin-pwa peerDependencies`). After updating, check the `precache` line in the build output and the offline test above.                                                                                                                                                                                                          |
| `@vite-pwa/assets-generator`                                | Only matters when you regenerate icons (`pnpm generate-pwa-assets`); if the output changes, review the PNGs before committing.                                                                                                                                                                                                                                                                           |
| `react`, `react-dom`, `@types/react`, `@types/react-dom`    | Together. `framework7-react` and Testing Library declare which React versions they support.                                                                                                                                                                                                                                                                                                              |
| `@testing-library/react`                                    | Needs `@testing-library/dom` as a peer: keep both.                                                                                                                                                                                                                                                                                                                                                       |
| `typescript`                                                | A major update can change `tsc -b` results and the type-aware lint rules; run `pnpm check` and read the errors rather than silencing them.                                                                                                                                                                                                                                                               |
| `@types/node`                                               | Follows the Node version, not the newest release: see Node below.                                                                                                                                                                                                                                                                                                                                        |
| `lucide-react`                                              | Icons can be renamed or removed in a major; the build and type-check catch every import.                                                                                                                                                                                                                                                                                                                 |

### pnpm

Change `packageManager` in `package.json` to `pnpm@<version>`. CI (`pnpm/action-setup`) and the Dockerfile read it from there. Install the same version locally with `npm install -g pnpm@<version>` (under the right Node version, since global packages are per Node version), then `pnpm install` and `pnpm check`. Commit any lockfile change with it.

### Node

Node is pinned in three places that must agree, and CI fails if `.nvmrc` and the `Dockerfile` differ:

1. `nvm install <version>`, then write that exact version in `.nvmrc`.
2. Update the Node base image in the `Dockerfile`: tag and digest together (see below), using the same version.
3. For a new **major**, also update `@types/node` (`pnpm add -D @types/node@^<major>`), `engines.node` in `package.json`, and the Node mentions in this README. Check each tool still declares support (`pnpm view <package> engines`).
4. `nvm use`, reinstall pnpm for this Node (`npm install -g pnpm`), then `pnpm install` and `pnpm check`. Build and run the Docker image too.

### Docker base images (version and digest)

Both base images in the `Dockerfile` are pinned as `name:version@sha256:digest`. Docker uses the digest and ignores the tag when both are present, so **change the tag and the digest together**, otherwise the tag no longer tells the truth about what runs.

1. **Pick the new version tag**, e.g. `node:26.13.1-alpine` or `nginxinc/nginx-unprivileged:1.31.8-alpine` (Docker Hub tags page of the image). Stay on the same major (and, for nginx, the same minor line unless you have read the release notes).
2. **Get its digest:** `docker buildx imagetools inspect node:26.13.1-alpine` and copy the top `Digest:` line. It is the digest of the multi-architecture index, which is the one to use (it also works on the Pi's arm64). `docker pull <image>` prints the same `Digest:`.
3. **Edit the `FROM` line**: new tag and new digest. For Node, also update `.nvmrc` to the same version.
4. **Build and run it** with the same flags as `docker-compose.yml`, and look at what nginx serves:

   ```sh
   docker build -t cabin-app:local .
   docker run -d --name cabin-app-test -p 8080:8080 --read-only --tmpfs /tmp --cap-drop ALL --security-opt no-new-privileges cabin-app:local
   docker ps --filter name=cabin-app-test        # wait until it says (healthy)
   curl -sI http://localhost:8080/               # CSP, no-cache and security headers present, Server: nginx without a version
   curl -sI http://localhost:8080/sw.js          # Cache-Control: no-cache
   docker rm -f cabin-app-test
   ```

   Then open `http://localhost:8080` and confirm in DevTools that there are no CSP errors in the console, the service worker activates and the app works with _Offline_ ticked. For an nginx update, read its release notes for changes that affect `nginx/default.conf`.

5. **Run `pnpm check`**, commit the `Dockerfile` (and `.nvmrc`) and push. CI checks that the Node versions agree, and the Docker workflow scans the new image with Trivy. If the new base already contains the fixes that the `apk upgrade` line installs, leave that line in anyway: it keeps releases current.
6. To go back, revert the commit: the old digest is still in git history.

### GitHub Actions

The versions in `.github/workflows/*.yml` (`actions/checkout@v7` and so on) are major tags. To update, change the major, read that action's release notes for breaking input changes, push and watch the run succeed.

## GitHub repository setup

Some settings live on GitHub, not in files. This is what is configured, so you can recreate it:

- **Branch ruleset on `main`**, versioned in `.github/rulesets/main.json`: `main` cannot be deleted or force-pushed, and the status checks `check` (CI) and `image` (Docker workflow) must pass. These are the job names in the workflows; renaming a job means updating the ruleset. Repository admins (you) are allowed to bypass it, so direct pushes to `main` still work; it is Dependabot and other pull requests that cannot merge until both checks are green. Apply or reapply it with `gh api -X POST repos/ismarslomic/cabin-app/rulesets --input .github/rulesets/main.json` (to change an existing one, `PUT` to `rulesets/<id>` instead).
- **Merged branches are deleted automatically.**
- **Security:** Dependabot alerts and security updates, private vulnerability reporting (the channel `SECURITY.md` points to), and secret scanning with push protection are enabled.
- **Codecov:** the Codecov GitHub app is installed and the `CODECOV_TOKEN` Actions secret is set. Dependabot pull requests skip the upload because Dependabot runs do not get Actions secrets.
- **Package:** the `cabin-app` GHCR package is public.

Community files: `LICENSE` (MIT), `SECURITY.md`, a pull request template and `CODEOWNERS` are in the repo. A `CONTRIBUTING.md`, a code of conduct and issue templates are left out on purpose: this is a personal project, and `README.md` and `CLAUDE.md` already explain how to work in it. Add them if you ever invite contributors; GitHub's community-standards percentage is below 100% because of that.

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

## License

[MIT](LICENSE)
