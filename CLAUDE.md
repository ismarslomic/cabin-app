# cabin-app

Slomic Smarthytte: mobile-first PWA (React 19, TypeScript, Vite). UI text is Norwegian Bokmål (`nb`); code, comments and docs are English. See `README.md` for what each tool is for.
This file overrides the global Kotlin/Gradle instructions: this is a **pnpm** project.

## Commands

- Node 26 (`.nvmrc`). Run `nvm use` in a new shell first (`source ~/.nvm/nvm.sh && nvm use`).
- Package manager: `pnpm` only. Never npm or yarn.
- `pnpm dev`, `pnpm test` (Vitest, once) / `pnpm test:watch`, `pnpm typecheck`, `pnpm lint` (type-aware via oxlint-tsgolint), `pnpm build` (includes type-check).
- Handle promises: await them, or mark with `void`. `no-floating-promises` is an error.
- `pnpm format` writes formatting (oxfmt); `pnpm format:check` verifies it. Do not hand-format.
- `pnpm test:coverage` shows coverage (`coverage/` is git-ignored). CI (`.github/workflows/ci.yml`) runs the same steps as `pnpm check` plus coverage.
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
