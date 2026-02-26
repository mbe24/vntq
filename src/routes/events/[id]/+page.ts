import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => {
  const response = await fetch(`/api/v1/events/${params.id}`);
  if (!response.ok) {
    throw error(response.status, 'Event not found');
  }

  const payload = await response.json();
  return {
    event: payload.item
  };
};

