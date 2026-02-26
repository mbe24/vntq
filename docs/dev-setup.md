# Dev Setup

## Prerequisites
- Bun
- Docker + Docker Compose

## Environment
Create `.env` from `.env.example`.

Important defaults:
- `DATABASE_URL=postgres://postgres:postgres@localhost:5432/vntq`
- `OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf`
- `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318`
- `LOG_FORMAT=pretty` for readable terminal logs (`json` for machine-readable output)

## Local Run
1. Start infra:
   - `docker compose up -d`
2. Install dependencies:
   - `bun install`
3. Run migrations:
   - `bun run db:migrate`
4. Seed data:
   - `bun run db:seed`
5. Start app:
   - `bun run dev`

## Smoke Checks
- `GET /api/v1/health`
- `GET /api/v1/search`
- `POST /api/v1/events`, then `PATCH /api/v1/events/:id`
