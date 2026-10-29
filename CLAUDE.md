# cabin-app

Slomic Smarthytte: mobile-first PWA (React 19, TypeScript, Vite). UI text is Norwegian Bokmål (`nb`); code, comments and docs are English. See `README.md` for what each tool is for.
This file overrides the global Kotlin/Gradle instructions: this is a **pnpm** project.

## Commands
- Package manager: `pnpm` only. Never npm or yarn.
- `pnpm dev`, `pnpm build` (includes type-check), `pnpm typecheck`, `pnpm lint` (type-aware via oxlint-tsgolint).
- Handle promises: await them, or mark with `void`. `no-floating-promises` is an error.
- `pnpm format` writes formatting (oxfmt); `pnpm format:check` verifies it. Do not hand-format.
- Run `pnpm format`, `pnpm build` and `pnpm lint` before every commit.

## Structure
Group by feature, not by technical layer. Full rules in `README.md` ("Folder structure").
- `src/app/`: wiring only. `src/features/<name>/`: pages, components, hooks, api, tests.
- `src/shared/`: only when 2+ features need it. `src/styles/`: global styling only.
- Features never import another feature's internals, and never import from `app/`.
- Use the `@/` alias for `src/`, not `../../..`.
- Tests sit next to the code.

## Workflow
- The stack is added one step at a time: configure, test, document, commit.
- Each step updates `README.md` (Stack table, Scripts, Decisions) and this file in the same commit.
- Match existing style. Do not reformat files you did not touch.
- Use the latest documented setup for each library; check its docs, not memory.
