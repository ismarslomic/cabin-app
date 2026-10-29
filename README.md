# Cabin app

Slomic Smarthytte: a mobile-first PWA for the cabin. The UI language is Norwegian Bokmål (`nb`). Built with React, TypeScript and Vite.

> The stack is added one step at a time. Each step is documented below when it lands.

## Getting started

Requires Node 24 and pnpm.

```sh
pnpm install
pnpm dev
```

## Scripts

| Script       | What it does                          |
| ------------ | ------------------------------------- |
| `pnpm dev`   | Start the Vite dev server             |
| `pnpm build` | Type-check (`tsc -b`) and build       |
| `pnpm lint`  | Run oxlint                            |
| `pnpm preview` | Serve the production build locally  |

## Stack

| Tool | Why | Config |
| ---- | --- | ------ |
| React 19 + TypeScript | UI and types | `tsconfig*.json` |
| Vite | Dev server and bundler | `vite.config.ts` |
| oxlint | Linting | `.oxlintrc.json` |

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
