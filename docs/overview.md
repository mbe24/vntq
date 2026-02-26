# vntq Overview

`vntq` is a minimal event search MVP.

Scope in MVP:
- Event search with related reference entities (`users`, `venues`, `artists`, `genres`, `vibes`).
- Open API endpoints for read and write.
- Postgres-backed search with full-text + filters.
- Nearby event search using venue coordinates.
- OTLP traces and logs for observability.

Deferred to Phase 2:
- Auth and write protection.
- CSV import and ingestion workers.
- Deduplication workflows.
- Additional domain entities (venue/artist/source).
