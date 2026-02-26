import { json } from '@sveltejs/kit';

export function errorJson(status: number, code: string, message: string) {
  return json(
    {
      error: {
        code,
        message
      }
    },
    { status }
  );
}

