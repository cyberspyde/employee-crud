# Repository Guidelines
## Project Structure & Module Organization
The React + TypeScript client lives in `src/`, with `components/` for views, `hooks/` for data access, `context/` for cross-cutting state, and `types/` housing shared models. The Express API and upload handlers sit in `server/index.js`; generated files land in `server/uploads/` and stay ignored. Database schemas are versioned under `database/migrations/`, while production bundles appear in `dist/` after builds.

## Build, Test, and Development Commands
- `npm run dev` starts API + client concurrently for day-to-day work.
- `npm run dev:server` / `npm run dev:client` isolate a side when debugging.
- `npm run build` followed by `npm run preview` simulates production.
- `npm run lint` enforces ESLint rules; treat warnings as blockers.
- `npm run typecheck` runs the standalone TypeScript compiler for contract drift.

## Coding Style & Naming Conventions
Honor the shared ESLint config in `eslint.config.js`, which already enables TypeScript strictness and React Hooks rules. Use two-space indentation, double quotes, PascalCase component filenames, and camelCase hooks that start with `use`. Favor named exports for reusable modules, co-locate related styles, and move server helpers into separate modules instead of expanding `server/index.js`.

## Testing Guidelines
Automated testing is not wired yet; when adding coverage, introduce `vitest` with React Testing Library for the client and `supertest` for API routes. Place UI tests alongside components as `Component.test.tsx` and keep integration suites in `src/__tests__/`. Cover happy and failure paths for CRUD flows, and record any manual smoke steps in `docs/` until tests land.

## Commit & Pull Request Guidelines
Adopt Conventional Commits (`feat:`, `fix:`, `chore:`) to replace the ad-hoc `'update'` history and keep subjects imperative. Reference Jira or GitHub issue IDs in bodies when relevant and squash noise before pushing. Pull requests should explain motivation, call out schema or migration impacts, attach before/after UI screenshots, and list the verification commands you ran.

## Environment & Configuration Tips
Copy `.env.example` to `.env` and supply `DATABASE_URL`, `DB_POOL_MAX`, and other secrets before running the server. Use the `ENV_PATH` override for alternate configs in CI or staging. Ship database changes with a new SQL file in `database/migrations/` plus rollback notes, and replay them locally via `psql -f` (or equivalent) ahead of review.
