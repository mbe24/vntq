import {
  check,
  doublePrecision,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const eventStatusEnum = pgEnum('event_status', ['active', 'cancelled']);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    displayName: text('display_name').notNull(),
    homeCity: text('home_city'),
    homeLatitude: doublePrecision('home_latitude'),
    homeLongitude: doublePrecision('home_longitude'),
    relevantCities: text('relevant_cities').array().notNull().default(sql`'{}'::text[]`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    homeCityIdx: index('users_home_city_idx').on(table.homeCity)
  })
);

export const venues = pgTable(
  'venues',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    city: text('city').notNull(),
    addressText: text('address_text').notNull(),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    websiteUrl: text('website_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    venueCityIdx: index('venues_city_idx').on(table.city),
    venueCoordsIdx: index('venues_lat_lng_idx').on(table.latitude, table.longitude)
  })
);

export const artists = pgTable(
  'artists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    genres: text('genres').array().notNull().default(sql`'{}'::text[]`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    artistNameIdx: index('artists_name_idx').on(table.name)
  })
);

export const genres = pgTable('genres', {
  code: text('code').primaryKey(),
  label: text('label').notNull().unique()
});

export const vibes = pgTable('vibes', {
  code: text('code').primaryKey(),
  label: text('label').notNull().unique()
});

export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    description: text('description'),
    startAt: timestamp('start_at', { withTimezone: true }).notNull(),
    endAt: timestamp('end_at', { withTimezone: true }),
    timezone: text('timezone').notNull(),
    city: text('city'),
    locationText: text('location_text'),
    genreTags: text('genre_tags').array().notNull().default(sql`'{}'::text[]`),
    vibeTags: text('vibe_tags').array().notNull().default(sql`'{}'::text[]`),
    venueId: uuid('venue_id').references(() => venues.id, { onDelete: 'set null' }),
    performerText: text('performer_text'),
    venueText: text('venue_text'),
    status: eventStatusEnum('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    startIdx: index('events_start_at_idx').on(table.startAt),
    cityIdx: index('events_city_idx').on(table.city),
    venueIdx: index('events_venue_id_idx').on(table.venueId),
    endAfterStart: check('events_end_after_start_check', sql`${table.endAt} IS NULL OR ${table.endAt} >= ${table.startAt}`)
  })
);

export const eventArtists = pgTable(
  'event_artists',
  {
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    artistId: uuid('artist_id')
      .notNull()
      .references(() => artists.id, { onDelete: 'cascade' })
  },
  (table) => ({
    pk: primaryKey({ columns: [table.eventId, table.artistId], name: 'event_artists_pk' })
  })
);

export const eventGenres = pgTable(
  'event_genres',
  {
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    genreCode: text('genre_code')
      .notNull()
      .references(() => genres.code, { onDelete: 'cascade' })
  },
  (table) => ({
    pk: primaryKey({ columns: [table.eventId, table.genreCode], name: 'event_genres_pk' })
  })
);

export const eventVibes = pgTable(
  'event_vibes',
  {
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    vibeCode: text('vibe_code')
      .notNull()
      .references(() => vibes.code, { onDelete: 'cascade' })
  },
  (table) => ({
    pk: primaryKey({ columns: [table.eventId, table.vibeCode], name: 'event_vibes_pk' })
  })
);

export type EventRow = typeof events.$inferSelect;
export type NewEventRow = typeof events.$inferInsert;
