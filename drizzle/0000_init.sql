CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_status') THEN
    CREATE TYPE event_status AS ENUM ('active', 'cancelled');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  timezone text NOT NULL,
  city text,
  location_text text,
  genre_tags text[] NOT NULL DEFAULT '{}'::text[],
  vibe_tags text[] NOT NULL DEFAULT '{}'::text[],
  performer_text text,
  venue_text text,
  status event_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT events_end_after_start_check CHECK (end_at IS NULL OR end_at >= start_at)
);

CREATE INDEX IF NOT EXISTS events_start_at_idx ON events (start_at);
CREATE INDEX IF NOT EXISTS events_city_idx ON events (city);
CREATE INDEX IF NOT EXISTS events_search_fts_idx
  ON events
  USING GIN (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(performer_text, '') || ' ' || coalesce(venue_text, '')));
