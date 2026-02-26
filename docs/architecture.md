# Architecture

## Runtime
- SvelteKit server routes provide the API.
- Bun runs development and scripts.
- Postgres stores events and serves search filters.

## Data
- One `events` table in MVP.
- Domain expansion tables now include `users`, `venues`, `artists`, `genres`, `vibes`.
- Association tables: `event_artists`, `event_genres`, `event_vibes`.
- Drizzle schema in `src/lib/server/db/schema.ts`.
- SQL migration files in `drizzle/`.

## API
- `GET /api/v1/health`
- `GET /api/v1/search`
- `GET /api/v1/events/:id`
- `POST /api/v1/events`
- `PATCH /api/v1/events/:id`

`GET /api/v1/search` also supports nearby filtering with `lat`, `lng`, and `radius_km`.

## Observability
- Request spans are created in `src/hooks.server.ts`.
- Logs are emitted with `trace_id` and `span_id`.
- OTLP exporter protocol is explicit:
- `http/protobuf` to `:4318` by default.
- Optional `grpc` to `:4317`.
