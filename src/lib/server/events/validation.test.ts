import { describe, expect, it } from 'bun:test';

import { createEventSchema, searchQuerySchema } from './validation';

describe('searchQuerySchema', () => {
  it('applies stable defaults for paging and radius', () => {
    const parsed = searchQuerySchema.parse({});

    expect(parsed.limit).toBe(20);
    expect(parsed.offset).toBe(0);
    expect(parsed.radius_km).toBe(25);
  });

  it('requires lat and lng together', () => {
    const parsed = searchQuerySchema.safeParse({ lat: 48.137154 });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((issue) => issue.message === 'lat and lng must be provided together')).toBe(
        true
      );
    }
  });
});

describe('createEventSchema', () => {
  it('rejects end_at earlier than start_at', () => {
    const parsed = createEventSchema.safeParse({
      title: 'Test Event',
      start_at: '2026-03-01T20:00:00Z',
      end_at: '2026-03-01T19:00:00Z',
      timezone: 'UTC'
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((issue) => issue.path.join('.') === 'end_at')).toBe(true);
    }
  });
});
