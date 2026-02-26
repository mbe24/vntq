import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { getOpenApiDocument } from '$lib/server/api/openapi';

export const GET: RequestHandler = async () => {
  return json(getOpenApiDocument(), {
    headers: {
      'cache-control': 'no-store'
    }
  });
};
