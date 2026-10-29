# Slomic Smarthytte

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
| `pnpm generate-pwa-assets` | Regenerate PWA icons from `public/favicon.svg`                                                       |
| `pnpm typecheck`           | Type-check only (`tsc -b`)                                                                           |
| `pnpm lint`                | Run oxlint (type-aware)                                                                              |
| `pnpm format`              | Format all files with oxfmt                                                                          |
| `pnpm format:check`        | Check formatting without writing                                                                     |
| `pnpm check`               | Everything CI would run: format check, lint, build (with type-check), tests. Run before every commit |
| `pnpm preview`             | Serve the production build locally                                                                   |

## Stack

| Tool                             | Why                                                                                               | Config                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| React 19 + TypeScript            | UI and types                                                                                      | `tsconfig*.json`                              |
| Vite                             | Dev server and bundler                                                                            | `vite.config.ts`                              |
| Framework7 + framework7-react    | Mobile UI components (iOS/Material look), router, page transitions                                | `src/app/f7-setup.ts`, `src/app/f7-params.ts` |
| lucide-react                     | Icons as React SVG components, tree-shaken per icon                                               | imported where used                           |
| vite-plugin-pwa + workbox-window | Web app manifest, service worker (Workbox `generateSW`), offline support, update prompt           | `VitePWA(...)` in `vite.config.ts`            |
| @vite-pwa/assets-generator       | Generates all PWA icons from one SVG                                                              | `pwa-assets.config.ts`                        |
| Vitest + jsdom                   | Test runner (shares `vite.config.ts`) and simulated browser DOM                                   | `test` block in `vite.config.ts`              |
| @testing-library/react + `dom`   | Render components and query them like a user would (`dom` is a required peer dependency)          | `src/test/setup.ts`                           |
| @testing-library/jest-dom        | DOM matchers such as `toBeVisible()` and `toBeInTheDocument()`                                    | `src/test/setup.ts`                           |
| @testing-library/user-event      | Realistic user interaction (`await user.click(...)`)                                              | n/a                                           |
| oxlint                           | Linting                                                                                           | `.oxlintrc.json`                              |
| oxlint-tsgolint                  | Type-aware lint rules for oxlint (e.g. `no-floating-promises`), powered by the TypeScript Go port | `options.typeAware` in `.oxlintrc.json`       |
| oxfmt                            | Formatting (Prettier-compatible, Rust)                                                            | `.oxfmtrc.json`                               |

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

## Decisions and gotchas

- **Folder skeleton:** the Vite template demo was removed and the feature-based skeleton plus the `@/` alias added.
- **Language:** app name is "Slomic Smarthytte" and the language is Norwegian Bokmål: `lang="nb"` in `index.html`, `lang: 'nb'` in the PWA manifest, and Norwegian Framework7 texts set in `f7-params.ts`.
- **Step 1, type-aware linting:** `typeAware` is enabled in `.oxlintrc.json`; oxlint finds `oxlint-tsgolint` automatically. `typescript/no-floating-promises` is set to `error` explicitly. Verified by adding an un-awaited promise, which failed `pnpm lint`. Type-aware rules slow linting slightly; that is expected.
- **Step 2, formatting:** oxfmt is configured with `semi: false` and `singleQuote: true` to match the existing code style (oxfmt defaults to semicolons and double quotes). `pnpm-lock.yaml` is ignored. oxfmt also formats Markdown and JSON, so `README.md` and `package.json` are formatted by `pnpm format`. The one-off reformat of existing files is in its own commit.
- **Node 26:** the project runs on Node 26 (LTS since 2026-10-28), pinned in `.nvmrc` and `engines`. Every tool in the stack declares support for it. `@types/node` is on the 26.x line to match; types should match the Node version in use, not the newest release, so bump them together with Node.
- **Step 3, testing:** Vitest runs in jsdom with globals off, so setup registers `cleanup` itself (Testing Library only auto-cleans when globals exist). The config lives in `vite.config.ts`, imported from `vitest/config`. Verified that a wrong assertion fails.
- **Step 4, Framework7:** wired as above. `lite-bundle` still includes every Framework7 component, so the production JS is about 1 MB (278 kB gzipped) and the Framework7 CSS about 500 kB (73 kB gzipped). Fine for a PWA that is cached after the first visit (each file is under Workbox's 2 MiB precache limit), but Framework7's custom build / lazy modules can shrink both if first-load time ever matters.
- **Viewport:** the docs suggest `maximum-scale=1, user-scalable=no`; we keep pinch-zoom enabled for accessibility and use `width=device-width, initial-scale=1, viewport-fit=cover`.
- **Routing:** the router uses in-memory history for now. Real URLs (`browserHistory`) would need the server and service worker to fall back to `index.html`; the generated worker already does (`navigateFallback`), so it can be switched on when deep links matter.
- **oxlint false positive:** `Framework7.use(...)` looks like a React hook to `rules-of-hooks`; the call in `f7-setup.ts` has a targeted disable comment.
- **Step 5, icons:** `lucide-react` is used for all icons. Tested by asserting the rendered `svg.lucide-house` is present and `aria-hidden`.
- **Step 6, PWA:** `registerType: 'prompt'` with a Framework7 toast; icons generated from one SVG with the `minimal-2023` preset; no `robots.txt` (a private family app does not need to be crawled). Verified in a real Chrome against `vite preview`: the service worker activates, the manifest is served (name, `lang: nb`, 4 icons), a reload with the network off still renders the app, and there are no console errors. That check was a one-off script, not part of the repo; the unit tests cover the update prompt only.
- **Step 7, check script:** `pnpm check` chains format check, lint, build and tests (the build runs `tsc -b`, so type-checking is included). There is no CI yet; when one is added it should run `pnpm check`.
