# vntq

[![CI](https://github.com/mbe24/vntq/actions/workflows/ci.yml/badge.svg)](https://github.com/vntq/svelte-bun/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-PolyForm%20Noncommercial%201.0.0-blue)](https://polyformproject.org/licenses/noncommercial/1.0.0/)

Edge-native event-query service for concerts, gigs, comedy, and live experiences.

## What This Repo Includes
- Public event search UI (SvelteKit).
- Open API endpoints under `/api/v1/*`.
- Postgres data model and seed data (Drizzle + SQL migrations).
- OTLP observability with local Grafana LGTM (logs, traces, metrics).
- OpenAPI spec generation from Zod-backed contracts.

## Tech Stack
- `SvelteKit` + `TypeScript`
- `Bun` (package manager, script runner, local tooling)
- `Drizzle ORM` + `PostgreSQL`
- `OpenTelemetry` + `Grafana LGTM`
- `Zod` + `zod-to-openapi`

## Repository Layout
- `src/routes`: UI routes + API routes.
- `src/lib/server`: DB access, domain logic, observability, OpenAPI builder.
- `scripts`: migration/seed/openapi generation scripts.
- `drizzle`: SQL migrations.
- `docs`: architecture/setup docs + generated `openapi.json`.
- `static`: static assets (favicon, etc.).

## Prerequisites
- Bun `>= 1.3`
- Docker + Docker Compose

## Local Development
1. Copy environment file (`cp .env.example .env` on macOS/Linux, `Copy-Item .env.example .env` on Windows PowerShell).
2. Start infrastructure: `docker compose up -d`
3. Install dependencies: `bun install`
4. Apply migrations: `bun run db:migrate`
5. Seed local data: `bun run db:seed`
6. Start app: `bun run dev`

## Local URLs
- App: `http://localhost:5173`
- Health: `http://localhost:5173/api/v1/health`
- OpenAPI JSON: `http://localhost:5173/api/v1/openapi.json`
- Swagger UI (dev): `http://localhost:5173/api/v1/docs`
- Grafana LGTM: `http://localhost:3000`

## Commands
- `bun run dev`: Start development server.
- `bun run build`: Build app.
- `bun run preview`: Preview production build.
- `bun run check`: Type-check + Svelte diagnostics.
- `bun run db:migrate`: Run SQL migrations in `drizzle/`.
- `bun run db:seed`: Seed local sample data.
- `bun run openapi:generate`: Generate `docs/openapi.json`.

## API Summary
- `GET /api/v1/health`
- `GET /api/v1/search`
- `GET /api/v1/events/:id`
- `POST /api/v1/events`
- `PATCH /api/v1/events/:id`

Search query parameters:
- `q`, `city`, `from`, `to`, `genre`, `vibe`, `limit`, `offset`
- optional geo: `lat`, `lng`, `radius_km`

## Observability
- OTLP endpoint/protocol configured via environment variables.
- HTTP request logs/traces are correlated (`trace_id`, `span_id`, `request_id`).
- Local LGTM stack is defined in `docker-compose.yml`.

## Notes
- MVP routes are intentionally unauthenticated for fast iteration.
- Error JSON shape is stable: `{ "error": { "code": "...", "message": "..." } }`
