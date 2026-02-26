import { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { createEventSchema, searchQuerySchema, updateEventSchema } from '$lib/server/events/validation';

extendZodWithOpenApi(z);

const errorSchema = z
  .object({
    error: z.object({
      code: z.string(),
      message: z.string()
    })
  })
  .openapi('ErrorResponse');

const eventSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string().nullable(),
    startAt: z.string().datetime({ offset: true }),
    endAt: z.string().datetime({ offset: true }).nullable(),
    timezone: z.string(),
    city: z.string().nullable(),
    locationText: z.string().nullable(),
    genreTags: z.array(z.string()),
    vibeTags: z.array(z.string()),
    venueId: z.string().uuid().nullable(),
    performerText: z.string().nullable(),
    venueText: z.string().nullable(),
    status: z.enum(['active', 'cancelled']),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true })
  })
  .openapi('Event');

const eventItemResponseSchema = z.object({ item: eventSchema }).openapi('EventItemResponse');

const searchResponseSchema = z
  .object({
    items: z.array(eventSchema),
    total: z.number().int().min(0),
    limit: z.number().int().min(1).max(100),
    offset: z.number().int().min(0)
  })
  .openapi('SearchResponse');

const healthResponseSchema = z
  .object({
    status: z.enum(['ok', 'degraded']),
    ts: z.string().datetime({ offset: true }),
    checks: z.object({
      db: z.enum(['ok', 'error'])
    }),
    runtime: z.object({
      process_uptime_sec: z.number(),
      runtime_name: z.enum(['bun', 'node']),
      runtime_version: z.string(),
      node_compat_version: z.string()
    })
  })
  .openapi('HealthResponse');

const eventIdParamsSchema = z
  .object({
    id: z.string().uuid()
  })
  .openapi('EventIdParams');

let cachedDocument: unknown | null = null;

function buildDocument() {
  const registry = new OpenAPIRegistry();

  registry.registerPath({
    method: 'get',
    path: '/api/v1/health',
    summary: 'Health check',
    tags: ['System'],
    responses: {
      200: {
        description: 'Service healthy',
        content: {
          'application/json': {
            schema: healthResponseSchema
          }
        }
      },
      503: {
        description: 'Service degraded',
        content: {
          'application/json': {
            schema: healthResponseSchema
          }
        }
      }
    }
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/search',
    summary: 'Search events',
    tags: ['Events'],
    request: {
      query: searchQuerySchema
    },
    responses: {
      200: {
        description: 'Search result',
        content: {
          'application/json': {
            schema: searchResponseSchema
          }
        }
      },
      400: {
        description: 'Invalid query',
        content: {
          'application/json': {
            schema: errorSchema
          }
        }
      }
    }
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/events',
    summary: 'Create event',
    tags: ['Events'],
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: createEventSchema
          }
        }
      }
    },
    responses: {
      201: {
        description: 'Created',
        content: {
          'application/json': {
            schema: eventItemResponseSchema
          }
        }
      },
      400: {
        description: 'Invalid payload',
        content: {
          'application/json': {
            schema: errorSchema
          }
        }
      }
    }
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/events/{id}',
    summary: 'Get event by ID',
    tags: ['Events'],
    request: {
      params: eventIdParamsSchema
    },
    responses: {
      200: {
        description: 'Event',
        content: {
          'application/json': {
            schema: eventItemResponseSchema
          }
        }
      },
      404: {
        description: 'Not found',
        content: {
          'application/json': {
            schema: errorSchema
          }
        }
      }
    }
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/v1/events/{id}',
    summary: 'Update event',
    tags: ['Events'],
    request: {
      params: eventIdParamsSchema,
      body: {
        required: true,
        content: {
          'application/json': {
            schema: updateEventSchema
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Updated',
        content: {
          'application/json': {
            schema: eventItemResponseSchema
          }
        }
      },
      400: {
        description: 'Invalid payload',
        content: {
          'application/json': {
            schema: errorSchema
          }
        }
      },
      404: {
        description: 'Not found',
        content: {
          'application/json': {
            schema: errorSchema
          }
        }
      }
    }
  });

  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'vntq API',
      version: '0.1.0',
      description: 'Event search and management API for vntq.'
    },
    servers: [{ url: '/' }]
  });
}

export function getOpenApiDocument() {
  if (!cachedDocument) {
    cachedDocument = buildDocument();
  }
  return cachedDocument;
}
