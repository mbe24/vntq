import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/vntq';
const sql = postgres(connectionString, { max: 1 });

const users = [
  {
    id: '20000000-0000-0000-0000-000000000001',
    displayName: 'Alex Carter',
    homeCity: 'Boston',
    homeLatitude: 42.3601,
    homeLongitude: -71.0589,
    relevantCities: ['Boston', 'Cambridge', 'New York']
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    displayName: 'Jordan Kim',
    homeCity: 'Los Angeles',
    homeLatitude: 34.0522,
    homeLongitude: -118.2437,
    relevantCities: ['Los Angeles', 'Pasadena', 'Long Beach']
  },
  {
    id: '20000000-0000-0000-0000-000000000003',
    displayName: 'Sam Rivera',
    homeCity: 'Chicago',
    homeLatitude: 41.8781,
    homeLongitude: -87.6298,
    relevantCities: ['Chicago', 'Milwaukee']
  }
];

const venues = [
  {
    id: '30000000-0000-0000-0000-000000000001',
    name: 'Madison Square Garden',
    city: 'New York',
    address: '4 Pennsylvania Plaza, New York, NY 10001',
    latitude: 40.7505,
    longitude: -73.9934,
    website: 'https://www.msg.com/madison-square-garden'
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    name: 'Beacon Theatre',
    city: 'New York',
    address: '2124 Broadway, New York, NY 10023',
    latitude: 40.7804,
    longitude: -73.9818,
    website: 'https://www.msg.com/beacon-theatre'
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    name: 'Red Rocks Amphitheatre',
    city: 'Morrison',
    address: '18300 W Alameda Pkwy, Morrison, CO 80465',
    latitude: 39.6654,
    longitude: -105.2057,
    website: 'https://www.redrocksonline.com'
  },
  {
    id: '30000000-0000-0000-0000-000000000004',
    name: 'The Comedy Store',
    city: 'Los Angeles',
    address: '8433 Sunset Blvd, Los Angeles, CA 90069',
    latitude: 34.0973,
    longitude: -118.3613,
    website: 'https://thecomedystore.com'
  },
  {
    id: '30000000-0000-0000-0000-000000000005',
    name: 'The Chicago Theatre',
    city: 'Chicago',
    address: '175 N State St, Chicago, IL 60601',
    latitude: 41.8855,
    longitude: -87.6272,
    website: 'https://www.msg.com/the-chicago-theatre'
  }
];

const artists = [
  { id: '40000000-0000-0000-0000-000000000001', name: 'Taylor Swift', genres: ['pop'] },
  { id: '40000000-0000-0000-0000-000000000002', name: 'Foo Fighters', genres: ['rock', 'alternative'] },
  { id: '40000000-0000-0000-0000-000000000003', name: 'Dave Chappelle', genres: ['stand-up'] },
  { id: '40000000-0000-0000-0000-000000000004', name: 'Ali Wong', genres: ['stand-up'] },
  { id: '40000000-0000-0000-0000-000000000005', name: 'John Mulaney', genres: ['stand-up'] },
  { id: '40000000-0000-0000-0000-000000000006', name: 'The Killers', genres: ['rock', 'indie'] }
];

const genres = [
  { code: 'rock', label: 'Rock' },
  { code: 'pop', label: 'Pop' },
  { code: 'indie', label: 'Indie' },
  { code: 'stand-up', label: 'Stand-up Comedy' },
  { code: 'improv', label: 'Improv' },
  { code: 'alternative', label: 'Alternative' }
];

const vibes = [
  { code: 'aggressive', label: 'Aggressive' },
  { code: 'energetic', label: 'Energetic' },
  { code: 'chill', label: 'Chill' },
  { code: 'funny', label: 'Funny' },
  { code: 'intimate', label: 'Intimate' },
  { code: 'thoughtful', label: 'Thoughtful' }
];

const events = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    title: 'Taylor Swift Arena Night',
    description: 'Example data event featuring a real artist and venue.',
    startAt: '2026-06-12T00:00:00Z',
    endAt: '2026-06-12T03:00:00Z',
    timezone: 'America/New_York',
    city: 'New York',
    locationText: 'Madison Square Garden',
    genreTags: ['pop'],
    vibeTags: ['energetic'],
    performerText: 'Taylor Swift',
    venueText: 'Madison Square Garden',
    venueId: '30000000-0000-0000-0000-000000000001',
    status: 'active'
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    title: 'Foo Fighters Live at Red Rocks',
    description: 'Example data event featuring a real artist and venue.',
    startAt: '2026-07-03T01:00:00Z',
    endAt: '2026-07-03T04:00:00Z',
    timezone: 'America/Denver',
    city: 'Morrison',
    locationText: 'Red Rocks Amphitheatre',
    genreTags: ['rock', 'alternative'],
    vibeTags: ['aggressive', 'energetic'],
    performerText: 'Foo Fighters',
    venueText: 'Red Rocks Amphitheatre',
    venueId: '30000000-0000-0000-0000-000000000003',
    status: 'active'
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    title: 'Ali Wong and Friends',
    description: 'Example data comedy lineup with real performers.',
    startAt: '2026-05-10T03:00:00Z',
    endAt: '2026-05-10T05:00:00Z',
    timezone: 'America/Los_Angeles',
    city: 'Los Angeles',
    locationText: 'The Comedy Store',
    genreTags: ['stand-up'],
    vibeTags: ['funny', 'intimate'],
    performerText: 'Ali Wong',
    venueText: 'The Comedy Store',
    venueId: '30000000-0000-0000-0000-000000000004',
    status: 'active'
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    title: 'John Mulaney at Beacon Theatre',
    description: 'Example data comedy show with a real artist and venue.',
    startAt: '2026-05-22T23:30:00Z',
    endAt: '2026-05-23T01:00:00Z',
    timezone: 'America/New_York',
    city: 'New York',
    locationText: 'Beacon Theatre',
    genreTags: ['stand-up'],
    vibeTags: ['funny', 'thoughtful'],
    performerText: 'John Mulaney',
    venueText: 'Beacon Theatre',
    venueId: '30000000-0000-0000-0000-000000000002',
    status: 'active'
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    title: 'The Killers in Chicago',
    description: 'Example data event featuring a real band and venue.',
    startAt: '2026-08-15T01:00:00Z',
    endAt: '2026-08-15T03:30:00Z',
    timezone: 'America/Chicago',
    city: 'Chicago',
    locationText: 'The Chicago Theatre',
    genreTags: ['rock', 'indie'],
    vibeTags: ['energetic', 'chill'],
    performerText: 'The Killers',
    venueText: 'The Chicago Theatre',
    venueId: '30000000-0000-0000-0000-000000000005',
    status: 'active'
  }
];

const eventArtists = [
  { eventId: '10000000-0000-0000-0000-000000000001', artistId: '40000000-0000-0000-0000-000000000001' },
  { eventId: '10000000-0000-0000-0000-000000000002', artistId: '40000000-0000-0000-0000-000000000002' },
  { eventId: '10000000-0000-0000-0000-000000000003', artistId: '40000000-0000-0000-0000-000000000004' },
  { eventId: '10000000-0000-0000-0000-000000000004', artistId: '40000000-0000-0000-0000-000000000005' },
  { eventId: '10000000-0000-0000-0000-000000000005', artistId: '40000000-0000-0000-0000-000000000006' },
  { eventId: '10000000-0000-0000-0000-000000000003', artistId: '40000000-0000-0000-0000-000000000003' }
];

const eventGenres = [
  { eventId: '10000000-0000-0000-0000-000000000001', genreCode: 'pop' },
  { eventId: '10000000-0000-0000-0000-000000000002', genreCode: 'rock' },
  { eventId: '10000000-0000-0000-0000-000000000002', genreCode: 'alternative' },
  { eventId: '10000000-0000-0000-0000-000000000003', genreCode: 'stand-up' },
  { eventId: '10000000-0000-0000-0000-000000000004', genreCode: 'stand-up' },
  { eventId: '10000000-0000-0000-0000-000000000005', genreCode: 'rock' },
  { eventId: '10000000-0000-0000-0000-000000000005', genreCode: 'indie' }
];

const eventVibes = [
  { eventId: '10000000-0000-0000-0000-000000000001', vibeCode: 'energetic' },
  { eventId: '10000000-0000-0000-0000-000000000002', vibeCode: 'aggressive' },
  { eventId: '10000000-0000-0000-0000-000000000002', vibeCode: 'energetic' },
  { eventId: '10000000-0000-0000-0000-000000000003', vibeCode: 'funny' },
  { eventId: '10000000-0000-0000-0000-000000000003', vibeCode: 'intimate' },
  { eventId: '10000000-0000-0000-0000-000000000004', vibeCode: 'funny' },
  { eventId: '10000000-0000-0000-0000-000000000004', vibeCode: 'thoughtful' },
  { eventId: '10000000-0000-0000-0000-000000000005', vibeCode: 'chill' },
  { eventId: '10000000-0000-0000-0000-000000000005', vibeCode: 'energetic' }
];

async function run() {
  for (const user of users) {
    await sql`
      INSERT INTO users (
        id, display_name, home_city, home_latitude, home_longitude, relevant_cities
      )
      VALUES (
        ${user.id}::uuid,
        ${user.displayName},
        ${user.homeCity},
        ${user.homeLatitude},
        ${user.homeLongitude},
        ${user.relevantCities}::text[]
      )
      ON CONFLICT (id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        home_city = EXCLUDED.home_city,
        home_latitude = EXCLUDED.home_latitude,
        home_longitude = EXCLUDED.home_longitude,
        relevant_cities = EXCLUDED.relevant_cities,
        updated_at = now()
    `;
  }

  for (const venue of venues) {
    await sql`
      INSERT INTO venues (
        id, name, city, address_text, latitude, longitude, website_url
      )
      VALUES (
        ${venue.id}::uuid,
        ${venue.name},
        ${venue.city},
        ${venue.address},
        ${venue.latitude},
        ${venue.longitude},
        ${venue.website}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        city = EXCLUDED.city,
        address_text = EXCLUDED.address_text,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        website_url = EXCLUDED.website_url,
        updated_at = now()
    `;
  }

  for (const artist of artists) {
    await sql`
      INSERT INTO artists (id, name, genres)
      VALUES (${artist.id}::uuid, ${artist.name}, ${artist.genres}::text[])
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        genres = EXCLUDED.genres,
        updated_at = now()
    `;
  }

  for (const genre of genres) {
    await sql`
      INSERT INTO genres (code, label)
      VALUES (${genre.code}, ${genre.label})
      ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label
    `;
  }

  for (const vibe of vibes) {
    await sql`
      INSERT INTO vibes (code, label)
      VALUES (${vibe.code}, ${vibe.label})
      ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label
    `;
  }

  for (const event of events) {
    await sql`
      INSERT INTO events (
        id, title, description, start_at, end_at, timezone, city, location_text,
        genre_tags, vibe_tags, venue_id, performer_text, venue_text, status
      )
      VALUES (
        ${event.id}::uuid,
        ${event.title},
        ${event.description},
        ${event.startAt}::timestamptz,
        ${event.endAt}::timestamptz,
        ${event.timezone},
        ${event.city},
        ${event.locationText},
        ${event.genreTags}::text[],
        ${event.vibeTags}::text[],
        ${event.venueId}::uuid,
        ${event.performerText},
        ${event.venueText},
        ${event.status}::event_status
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        start_at = EXCLUDED.start_at,
        end_at = EXCLUDED.end_at,
        timezone = EXCLUDED.timezone,
        city = EXCLUDED.city,
        location_text = EXCLUDED.location_text,
        genre_tags = EXCLUDED.genre_tags,
        vibe_tags = EXCLUDED.vibe_tags,
        venue_id = EXCLUDED.venue_id,
        performer_text = EXCLUDED.performer_text,
        venue_text = EXCLUDED.venue_text,
        status = EXCLUDED.status,
        updated_at = now()
    `;
  }

  const seededEventIds = events.map((event) => event.id);
  await sql`DELETE FROM event_artists WHERE event_id = ANY(${seededEventIds}::uuid[])`;
  for (const row of eventArtists) {
    await sql`
      INSERT INTO event_artists (event_id, artist_id)
      VALUES (${row.eventId}::uuid, ${row.artistId}::uuid)
      ON CONFLICT DO NOTHING
    `;
  }

  await sql`DELETE FROM event_genres WHERE event_id = ANY(${seededEventIds}::uuid[])`;
  for (const row of eventGenres) {
    await sql`
      INSERT INTO event_genres (event_id, genre_code)
      VALUES (${row.eventId}::uuid, ${row.genreCode})
      ON CONFLICT DO NOTHING
    `;
  }

  await sql`DELETE FROM event_vibes WHERE event_id = ANY(${seededEventIds}::uuid[])`;
  for (const row of eventVibes) {
    await sql`
      INSERT INTO event_vibes (event_id, vibe_code)
      VALUES (${row.eventId}::uuid, ${row.vibeCode})
      ON CONFLICT DO NOTHING
    `;
  }
}

run()
  .then(async () => {
    await sql.end();
    console.log('Seed complete.');
  })
  .catch(async (error) => {
    console.error('Seed failed:', error);
    await sql.end();
    process.exit(1);
  });
