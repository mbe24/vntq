import { z } from 'zod';

const isoDatetime = z
  .string()
  .datetime({ offset: true })
  .or(z.string().datetime({ offset: false }));

const tagsSchema = z.array(z.string().min(1).trim()).transform((tags) => tags.map((tag) => tag.toLowerCase()));

const baseEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  start_at: isoDatetime,
  end_at: isoDatetime.optional().nullable(),
  timezone: z.string().min(1).max(80),
  city: z.string().max(120).optional().nullable(),
  location_text: z.string().max(240).optional().nullable(),
  genre_tags: tagsSchema.optional(),
  vibe_tags: tagsSchema.optional(),
  venue_id: z.string().uuid().optional().nullable(),
  performer_text: z.string().max(240).optional().nullable(),
  venue_text: z.string().max(240).optional().nullable(),
  status: z.enum(['active', 'cancelled']).optional()
});

export const createEventSchema = baseEventSchema.superRefine((value, ctx) => {
  if (value.end_at && new Date(value.end_at).getTime() < new Date(value.start_at).getTime()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['end_at'],
      message: 'end_at must be >= start_at'
    });
  }
});

export const updateEventSchema = baseEventSchema.partial().superRefine((value, ctx) => {
  if (value.start_at && value.end_at && new Date(value.end_at).getTime() < new Date(value.start_at).getTime()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['end_at'],
      message: 'end_at must be >= start_at'
    });
  }
});

export const searchQuerySchema = z.object({
  q: z.string().trim().optional(),
  city: z.string().trim().optional(),
  from: isoDatetime.optional(),
  to: isoDatetime.optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  radius_km: z.number().min(0.1).max(500).default(25),
  genre: z.array(z.string().trim().min(1)).optional(),
  vibe: z.array(z.string().trim().min(1)).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0)
}).superRefine((value, ctx) => {
  const hasLat = value.lat !== undefined;
  const hasLng = value.lng !== undefined;
  if (hasLat !== hasLng) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['lat'],
      message: 'lat and lng must be provided together'
    });
  }
});
