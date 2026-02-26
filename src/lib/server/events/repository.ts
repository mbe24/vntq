import { and, asc, eq, gte, lte, sql, type SQL } from 'drizzle-orm';

import { db } from '$lib/server/db/client';
import { events, type EventRow, venues } from '$lib/server/db/schema';

export interface SearchEventsInput {
  q?: string;
  city?: string;
  from?: string;
  to?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
  genre?: string[];
  vibe?: string[];
  limit: number;
  offset: number;
}

export interface SearchEventsResult {
  items: EventRow[];
  total: number;
}

function sanitizeNullable(value?: string | null): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeTags(tags?: string[]): string[] {
  return (tags ?? []).map((tag) => tag.trim().toLowerCase()).filter(Boolean);
}

function textArraySql(values: string[]): SQL {
  return sql`ARRAY[${sql.join(
    values.map((value) => sql`${value}`),
    sql`, `
  )}]::text[]`;
}

export async function getEventById(id: string): Promise<EventRow | null> {
  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return event ?? null;
}

export async function createEvent(input: {
  title: string;
  description?: string | null;
  start_at: string;
  end_at?: string | null;
  timezone: string;
  city?: string | null;
  location_text?: string | null;
  genre_tags?: string[];
  vibe_tags?: string[];
  venue_id?: string | null;
  performer_text?: string | null;
  venue_text?: string | null;
  status?: 'active' | 'cancelled';
}): Promise<EventRow> {
  const [event] = await db
    .insert(events)
    .values({
      title: input.title.trim(),
      description: sanitizeNullable(input.description),
      startAt: new Date(input.start_at),
      endAt: input.end_at ? new Date(input.end_at) : null,
      timezone: input.timezone,
      city: sanitizeNullable(input.city),
      locationText: sanitizeNullable(input.location_text),
      genreTags: sanitizeTags(input.genre_tags),
      vibeTags: sanitizeTags(input.vibe_tags),
      venueId: input.venue_id ?? null,
      performerText: sanitizeNullable(input.performer_text),
      venueText: sanitizeNullable(input.venue_text),
      status: input.status ?? 'active'
    })
    .returning();

  return event;
}

export async function updateEvent(
  id: string,
  input: Partial<{
    title: string;
    description: string | null;
    start_at: string;
    end_at: string | null;
    timezone: string;
    city: string | null;
    location_text: string | null;
    genre_tags: string[];
    vibe_tags: string[];
    venue_id: string | null;
    performer_text: string | null;
    venue_text: string | null;
    status: 'active' | 'cancelled';
  }>
): Promise<EventRow | null> {
  const nextValues: Record<string, unknown> = {
    updatedAt: new Date()
  };

  if (input.title !== undefined) nextValues.title = input.title.trim();
  if (input.description !== undefined) nextValues.description = sanitizeNullable(input.description);
  if (input.start_at !== undefined) nextValues.startAt = new Date(input.start_at);
  if (input.end_at !== undefined) nextValues.endAt = input.end_at ? new Date(input.end_at) : null;
  if (input.timezone !== undefined) nextValues.timezone = input.timezone;
  if (input.city !== undefined) nextValues.city = sanitizeNullable(input.city);
  if (input.location_text !== undefined) nextValues.locationText = sanitizeNullable(input.location_text);
  if (input.genre_tags !== undefined) nextValues.genreTags = sanitizeTags(input.genre_tags);
  if (input.vibe_tags !== undefined) nextValues.vibeTags = sanitizeTags(input.vibe_tags);
  if (input.venue_id !== undefined) nextValues.venueId = input.venue_id;
  if (input.performer_text !== undefined) nextValues.performerText = sanitizeNullable(input.performer_text);
  if (input.venue_text !== undefined) nextValues.venueText = sanitizeNullable(input.venue_text);
  if (input.status !== undefined) nextValues.status = input.status;

  const [event] = await db.update(events).set(nextValues).where(eq(events.id, id)).returning();
  return event ?? null;
}

export async function searchEvents(input: SearchEventsInput): Promise<SearchEventsResult> {
  const clauses: SQL[] = [];

  if (input.q && input.q.trim().length > 0) {
    clauses.push(
      sql`to_tsvector('simple', coalesce(${events.title}, '') || ' ' || coalesce(${events.description}, '') || ' ' || coalesce(${events.performerText}, '') || ' ' || coalesce(${events.venueText}, '')) @@ plainto_tsquery('simple', ${input.q.trim()})`
    );
  }

  if (input.city && input.city.trim().length > 0) {
    clauses.push(eq(events.city, input.city.trim()));
  }

  if (input.from) {
    clauses.push(gte(events.startAt, new Date(input.from)));
  }

  if (input.to) {
    clauses.push(lte(events.startAt, new Date(input.to)));
  }

  const genres = sanitizeTags(input.genre);
  if (genres.length > 0) {
    clauses.push(sql`${events.genreTags} && ${textArraySql(genres)}`);
  }

  const vibes = sanitizeTags(input.vibe);
  if (vibes.length > 0) {
    clauses.push(sql`${events.vibeTags} && ${textArraySql(vibes)}`);
  }

  if (input.lat !== undefined && input.lng !== undefined) {
    const radiusKm = input.radius_km ?? 25;
    clauses.push(sql`
      exists (
        select 1
        from ${venues} v
        where v.id = ${events.venueId}
          and (
            6371 * acos(
              least(
                1.0,
                greatest(
                  -1.0,
                  cos(radians(${input.lat})) * cos(radians(v.latitude)) * cos(radians(v.longitude) - radians(${input.lng}))
                  + sin(radians(${input.lat})) * sin(radians(v.latitude))
                )
              )
            )
          ) <= ${radiusKm}
      )
    `);
  }

  const whereClause = clauses.length > 0 ? and(...clauses) : undefined;

  const items = await db
    .select()
    .from(events)
    .where(whereClause)
    .orderBy(asc(events.startAt), asc(events.title))
    .limit(input.limit)
    .offset(input.offset);

  const countRows = await db.select({ total: sql<number>`count(*)` }).from(events).where(whereClause);
  const total = Number(countRows[0]?.total ?? 0);

  return { items, total };
}
