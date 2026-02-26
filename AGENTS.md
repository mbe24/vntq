# AGENTS

## Repository Structure
- `src/routes`: HTTP endpoints and page routes.
- `src/lib/server`: DB, domain logic, observability.
- `scripts`: migration and seed scripts.
- `drizzle`: SQL migrations.
- `docs`: project documentation.

## Commands
- `bun run dev`: start local app.
- `bun run db:migrate`: apply SQL migrations.
- `bun run db:seed`: seed local data.
- `bun run check`: type and Svelte checks.

## Environment Variables
- `DATABASE_URL`: Postgres connection string.
- `OTEL_SERVICE_NAME`: service name for telemetry.
- `OTEL_EXPORTER_OTLP_PROTOCOL`: `http/protobuf` or `grpc`.
- `OTEL_EXPORTER_OTLP_ENDPOINT`: OTLP collector endpoint.

## Agent Rules
- Keep MVP endpoints open unless explicitly asked to add auth.
- Preserve JSON error shape: `{ "error": { "code": "...", "message": "..." } }`.
- Use explicit OTLP protocol config. Do not infer protocol from endpoint.
- Keep schema and SQL migrations in sync.
- Prefer minimal, stability-focused tests in MVP.

