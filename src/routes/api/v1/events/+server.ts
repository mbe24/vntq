import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { createEvent } from '$lib/server/events/repository';
import { createEventSchema } from '$lib/server/events/validation';
import { errorJson } from '$lib/server/http';

export const POST: RequestHandler = async ({ request }) => {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return errorJson(400, 'INVALID_JSON', 'Request body must be valid JSON');
  }

  const parsed = createEventSchema.safeParse(payload);
  if (!parsed.success) {
    return errorJson(400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid payload');
  }

  const event = await createEvent(parsed.data);
  return json({ item: event }, { status: 201 });
};

