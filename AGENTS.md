# Repository Guidelines

## Project Structure & Module Organization

IronCore uses React 19, TypeScript, Vite, Express, and PostgreSQL. UI pages live in `src/pages/`, grouped by dashboard role; reusable controls belong in `src/components/`. Shared validation lives in `src/lib/validation.ts`; API clients are in `src/lib/` and `src/services/`. Use `src/context/` for application context, `src/assets/` for imported assets, and `public/` for static files.

`server.ts` starts the application; `api/index.ts` provides the serverless entry point. Backend routes, authentication, database access, and persistence live in `server/`; AI-health logic lives in `server/health/`. Tests are in `tests/`, and implementation/setup documentation is in `docs/`. Treat `dist/` as generated output.

## Build, Test, and Development Commands

- `npm ci`: install dependencies from the lockfile; use Node.js 20 or newer.
- `npm run dev`: start the development Express/Vite application.
- `npm run lint`: run TypeScript checking (`tsc --noEmit`), not ESLint.
- `npm test`: run Node's test runner through `tsx`, including embedded PostgreSQL tests.
- `npm run test:ui`: build and run Playwright tests on desktop/mobile viewports; requires Chrome and port 4179.
- `npm run build`: build the frontend and bundle `dist/server.cjs`.
- `npm start`: run the production build.

## Coding Style & Naming Conventions

Follow nearby TypeScript conventions: two-space indentation, single quotes, and semicolons. Use PascalCase for React components and camelCase for functions/variables. Keep backend modules focused and reuse shared validators instead of duplicating rules. Preserve existing Tailwind styling and responsive layouts. No dedicated formatter script is configured; avoid unrelated formatting changes.

## Testing Guidelines

Name unit/API tests `*.test.ts` and browser tests `*.spec.ts`. Cover changed behavior, invalid input, authorization, and persistence failures where relevant. Use isolated PGlite databases and mocked external providers; never target live data. No numeric coverage threshold is configured. Run type checking and relevant tests before submitting; run browser checks for form/layout changes.

## Commit & Pull Request Guidelines

History uses concise imperative subjects such as “Add comprehensive input validation”; no mandatory prefix is established. Keep commits focused. PRs should explain the problem, resulting behavior, validation performed, and migration/configuration impacts. Link relevant issues and include screenshots for visible UI changes.

## Security & Configuration

Use `.env.example` as the configuration template; never commit secrets or log credentials. Preserve legacy accounts and data. Review the target database before running migration scripts, and document schema changes. Consult `docs/ai-health-setup.md` for provider setup.
