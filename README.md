# Slomic Smarthytte

Slomic Smarthytte: a mobile-first PWA for the cabin. The UI language is Norwegian Bokmål (`nb`). Built with React, TypeScript and Vite.

> The stack is added one step at a time. Each step is documented below when it lands.

## Getting started

Requires Node 24 and pnpm.

```sh
pnpm install
pnpm dev
```

## Scripts

| Script              | What it does                       |
| ------------------- | ---------------------------------- |
| `pnpm dev`          | Start the Vite dev server          |
| `pnpm build`        | Type-check (`tsc -b`) and build    |
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

## Editor setup (IntelliJ IDEA)

1. Install the [Oxc plugin](https://plugins.jetbrains.com/plugin/27061-oxc) (Settings > Plugins > Marketplace > "Oxc"). It runs the project's own `oxfmt` and `oxlint`, so run `pnpm install` first.
2. In the plugin's settings (search for "Oxfmt" and "Oxlint" in Settings), enable formatting on save, and optionally fix-on-save for lint.

`.idea/` is not committed, so this is a per-machine setup. `pnpm format:check` is the source of truth.

## Folder structure

Code is grouped by **feature**, not by technical layer.

```
src/
├── main.tsx      # entry point
├── app/          # app shell and wiring only (App, routes, config)
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
- **Types for Node:** `@types/node` stays on the 24.x line to match the Node 24 runtime. Types should match the Node version in use, not the newest release, otherwise they declare APIs that may not exist at runtime. Bump it together with Node.
