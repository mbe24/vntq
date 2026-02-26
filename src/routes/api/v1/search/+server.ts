import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { searchEvents } from '$lib/server/events/repository';
import { searchQuerySchema } from '$lib/server/events/validation';
import { errorJson } from '$lib/server/http';

function parseMultiValue(params: URLSearchParams, key: string): string[] | undefined {
  const values = params
    .getAll(key)
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  return values.length > 0 ? values : undefined;
}

function parseLimit(raw: string | null): number {
  if (!raw) return 20;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 20;
  return parsed;
}

function parseOffset(raw: string | null): number {
  if (!raw) return 0;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 0;
  return parsed;
}

function parseNumber(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

export const GET: RequestHandler = async ({ url }) => {
  const input = {
    q: url.searchParams.get('q') ?? undefined,
    city: url.searchParams.get('city') ?? undefined,
    from: url.searchParams.get('from') ?? undefined,
    to: url.searchParams.get('to') ?? undefined,
    lat: parseNumber(url.searchParams.get('lat')),
    lng: parseNumber(url.searchParams.get('lng')),
    radius_km: parseNumber(url.searchParams.get('radius_km')),
    genre: parseMultiValue(url.searchParams, 'genre'),
    vibe: parseMultiValue(url.searchParams, 'vibe'),
    limit: parseLimit(url.searchParams.get('limit')),
    offset: parseOffset(url.searchParams.get('offset'))
  };

  const parsed = searchQuerySchema.safeParse(input);
  if (!parsed.success) {
    return errorJson(400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid query');
  }

  const result = await searchEvents(parsed.data);
  return json({
    items: result.items,
    total: result.total,
    limit: parsed.data.limit,
    offset: parsed.data.offset
  });
};
