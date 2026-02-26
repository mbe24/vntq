import { describe, expect, it } from 'bun:test';

import { getOpenApiDocument } from './openapi';

describe('getOpenApiDocument', () => {
  it('contains core API paths', () => {
    const document = getOpenApiDocument() as {
      openapi?: string;
      paths?: Record<string, unknown>;
      info?: { title?: string };
    };

    expect(document.openapi).toBe('3.0.3');
    expect(document.info?.title).toBe('vntq API');
    expect(document.paths?.['/api/v1/health']).toBeDefined();
    expect(document.paths?.['/api/v1/search']).toBeDefined();
    expect(document.paths?.['/api/v1/events']).toBeDefined();
    expect(document.paths?.['/api/v1/events/{id}']).toBeDefined();
  });
});
