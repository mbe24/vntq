import { context, SpanStatusCode, trace } from '@opentelemetry/api';
import type { Handle } from '@sveltejs/kit';

import { initObservability, logError, logInfo, logWarn } from '$lib/server/observability';

initObservability();

const tracer = trace.getTracer('vntq-http');

export const handle: Handle = async ({ event, resolve }) => {
  const requestId = crypto.randomUUID();
  event.locals.requestId = requestId;

  const requestSpan = tracer.startSpan(`http ${event.request.method}`, {
    attributes: {
      'http.method': event.request.method,
      'http.route': event.url.pathname,
      'request.id': requestId
    }
  });

  return context.with(trace.setSpan(context.active(), requestSpan), async () => {
    try {
      const response = await resolve(event);
      requestSpan.setAttribute('http.status_code', response.status);

      const logAttributes = {
        request_id: requestId,
        'http.method': event.request.method,
        'url.path': event.url.pathname,
        'http.status_code': response.status
      };

      if (response.status >= 500) {
        requestSpan.setStatus({
          code: SpanStatusCode.ERROR,
          message: `http status ${response.status}`
        });
        logError('http.server.request.failed', logAttributes);
      } else if (response.status >= 400) {
        logWarn('http.server.request.client_error', logAttributes);
      } else {
        logInfo('http.server.request.completed', logAttributes);
      }

      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unexpected error';
      requestSpan.recordException(error as Error);
      requestSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message
      });

      logError('http.server.request.failed', {
        request_id: requestId,
        'http.method': event.request.method,
        'url.path': event.url.pathname,
        error_message: message
      });

      throw error;
    } finally {
      requestSpan.end();
    }
  });
};
