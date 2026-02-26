CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  home_city text,
  home_latitude double precision,
  home_longitude double precision,
  relevant_cities text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_home_city_idx ON users (home_city);

CREATE TABLE IF NOT EXISTS venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL,
  address_text text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  website_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS venues_city_idx ON venues (city);
CREATE INDEX IF NOT EXISTS venues_lat_lng_idx ON venues (latitude, longitude);

CREATE TABLE IF NOT EXISTS artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  genres text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS artists_name_idx ON artists (name);

CREATE TABLE IF NOT EXISTS genres (
  code text PRIMARY KEY,
  label text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS vibes (
  code text PRIMARY KEY,
  label text NOT NULL UNIQUE
);

ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_id uuid;
ALTER TABLE events
  DROP CONSTRAINT IF EXISTS events_venue_id_fk;
ALTER TABLE events
  ADD CONSTRAINT events_venue_id_fk
  FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS events_venue_id_idx ON events (venue_id);

CREATE TABLE IF NOT EXISTS event_artists (
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  artist_id uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  CONSTRAINT event_artists_pk PRIMARY KEY (event_id, artist_id)
);

CREATE TABLE IF NOT EXISTS event_genres (
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  genre_code text NOT NULL REFERENCES genres(code) ON DELETE CASCADE,
  CONSTRAINT event_genres_pk PRIMARY KEY (event_id, genre_code)
);

CREATE TABLE IF NOT EXISTS event_vibes (
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  vibe_code text NOT NULL REFERENCES vibes(code) ON DELETE CASCADE,
  CONSTRAINT event_vibes_pk PRIMARY KEY (event_id, vibe_code)
);

