<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# TalentAI Web - Agent Guidelines

- **Architecture**: Next.js App Router, Feature-based, Contract-first (OpenAPI), BFF architecture.
- **Rules Directory**: Refer to `.agent/rules/` for project, frontend, data-mode, and security guidelines.
- **Workflows**: Refer to `.agent/workflows/` for development procedures.
- **BFF Pattern**: All client data calls go through `/api/bff/*` routed via `DATA_MODE` (`mock` or `real`).
- **Feature Structure**: Each feature in `src/features/*` must adhere to `components/`, `hooks/`, `services/`, `schemas/`, `types.ts`, and `index.ts`.
