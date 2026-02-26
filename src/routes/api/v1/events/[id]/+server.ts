import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { getEventById, updateEvent } from '$lib/server/events/repository';
import { errorJson } from '$lib/server/http';
import { updateEventSchema } from '$lib/server/events/validation';

export const GET: RequestHandler = async ({ params }) => {
  const item = await getEventById(params.id);
  if (!item) {
    return errorJson(404, 'NOT_FOUND', 'Event not found');
  }
  return json({ item });
};

export const PATCH: RequestHandler = async ({ params, request }) => {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return errorJson(400, 'INVALID_JSON', 'Request body must be valid JSON');
  }

  const parsed = updateEventSchema.safeParse(payload);
  if (!parsed.success) {
    return errorJson(400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid payload');
  }

  const item = await updateEvent(params.id, parsed.data);
  if (!item) {
    return errorJson(404, 'NOT_FOUND', 'Event not found');
  }

  return json({ item });
};

