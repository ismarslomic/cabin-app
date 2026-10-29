# Slomic Smarthytte

Slomic Smarthytte: a mobile-first PWA for the cabin. The UI language is Norwegian Bokmål (`nb`). Built with React, TypeScript and Vite.

> The stack is added one step at a time. Each step is documented below when it lands.

## Getting started

Requires Node 26 (see `.nvmrc`) and pnpm. With nvm, global packages are per Node version, so install pnpm once after installing Node 26 (`npm install -g pnpm`).

```sh
nvm use
pnpm install
pnpm dev
```

## Scripts

| Script              | What it does                       |
| ------------------- | ---------------------------------- |
| `pnpm dev`          | Start the Vite dev server          |
| `pnpm build`        | Type-check (`tsc -b`) and build    |
| `pnpm test`         | Run all tests once (Vitest)        |
| `pnpm test:watch`   | Run tests in watch mode            |
| `pnpm typecheck`    | Type-check only (`tsc -b`)         |
| `pnpm lint`         | Run oxlint (type-aware)            |
| `pnpm format`       | Format all files with oxfmt        |
| `pnpm format:check` | Check formatting without writing   |
| `pnpm preview`      | Serve the production build locally |

## Stack

| Tool                  | Why                                                                                               | Config                                  |
| --------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------- |
| React 19 + TypeScript | UI and types                                                                                      | `tsconfig*.json`                        |
| Vite                  | Dev server and bundler                                                                            | `vite.config.ts`                        |
| oxlint                | Linting                                                                                           | `.oxlintrc.json`                        |
| oxfmt                 | Formatting (Prettier-compatible, Rust)                                                            | `.oxfmtrc.json`                         |
| oxlint-tsgolint       | Type-aware lint rules for oxlint (e.g. `no-floating-promises`), powered by the TypeScript Go port | `options.typeAware` in `.oxlintrc.json` |

## Framework7

- `framework7/lite-bundle` is the core for React; `Framework7.use(Framework7React)` registers the integration (`src/app/f7-setup.ts`, imported by `App.tsx`).
- The CSS (`framework7/css/bundle`) is imported in `src/styles/index.css`. The app mounts in `<div id="app">`.
- `src/app/f7-params.ts` holds the app parameters: name, `theme: 'auto'` (iOS look on iOS, Material elsewhere), `darkMode: 'auto'` (follows the system), routes and Norwegian texts.
- **Pages and routes.** A page is a component with `<Page>` at the root. Each feature exports its routes from `features/<name>/index.ts` (e.g. `homeRoutes`) and `app/routes.ts` collects them. Use `asyncComponent: () => import(...)` on a route to lazy-load a page.
- **Texts are Norwegian.** Framework7 has no locale files, so built-in texts are set per component through parameters (currently `dialog.buttonOk` and `dialog.buttonCancel`). Add the others (calendar, searchbar, etc.) when a feature uses them.
- Framework7 UI is built from its components (`Page`, `Navbar`, `Block`, `List`, ...); check the [React docs](https://framework7.io/react/) before writing custom UI.

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

- **Step 0:** removed the Vite template demo, added the folder skeleton and the `@/` alias.
- **Language:** app name is "Slomic Smarthytte" and the language is Norwegian Bokmål (`lang="nb"` in `index.html`). Use `nb` for the PWA manifest and the Framework7 locale when they are added.
- **Step 1, type-aware linting:** `typeAware` is enabled in `.oxlintrc.json`; oxlint finds `oxlint-tsgolint` automatically. `typescript/no-floating-promises` is set to `error` explicitly. Verified by adding an un-awaited promise, which failed `pnpm lint`. Type-aware rules slow linting slightly; that is expected.
- **Step 2, formatting:** oxfmt is configured with `semi: false` and `singleQuote: true` to match the existing code style (oxfmt defaults to semicolons and double quotes). `pnpm-lock.yaml` is ignored. oxfmt also formats Markdown and JSON, so `README.md` and `package.json` are formatted by `pnpm format`. The one-off reformat of existing files is in its own commit.
- **Node 26:** the project runs on Node 26 (LTS since 2026-10-28), pinned in `.nvmrc` and `engines`. Every tool in the stack declares support for it. `@types/node` is on the 26.x line to match; types should match the Node version in use, not the newest release, so bump them together with Node.
- **Step 3, testing:** Vitest runs in jsdom with globals off, so setup registers `cleanup` itself (Testing Library only auto-cleans when globals exist). The config lives in `vite.config.ts`, imported from `vitest/config`. Verified that a wrong assertion fails.
- **Step 4, Framework7:** wired as above. `lite-bundle` still includes every Framework7 component, so the production JS is about 1 MB (278 kB gzipped). Revisit before/with the PWA step (precache size) using Framework7's custom build / lazy modules.
- **Viewport:** the docs suggest `maximum-scale=1, user-scalable=no`; we keep pinch-zoom enabled for accessibility and use `width=device-width, initial-scale=1, viewport-fit=cover`.
- **Routing:** the router uses in-memory history for now. Decide on `browserHistory` (real URLs, needs an SPA fallback) when we do the PWA step.
- **oxlint false positive:** `Framework7.use(...)` looks like a React hook to `rules-of-hooks`; the call in `f7-setup.ts` has a targeted disable comment.
- **Not verified visually:** tests, build and the dev server compile pass, but the rendered look has to be checked in a browser (`pnpm dev`).
