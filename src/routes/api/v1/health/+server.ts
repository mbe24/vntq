import { json } from '@sveltejs/kit';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import type { RequestHandler } from './$types';

import { sqlClient } from '$lib/server/db/client';
import {
  recordHealthDbPingDuration,
  recordHealthDbPingFailure,
  recordHealthRequest,
  recordHealthRequestDuration
} from '$lib/server/observability/metrics';
import { logError, logInfo } from '$lib/server/observability';

const tracer = trace.getTracer('vntq-health');

function roundMs(value: number): number {
  return Math.round(value * 100) / 100;
}

function runtimeSnapshot() {
  const bunRuntime = (globalThis as { Bun?: { version?: string } }).Bun;

  if (bunRuntime?.version) {
    return {
      process_uptime_sec: roundMs(process.uptime()),
      runtime_name: 'bun' as const,
      runtime_version: bunRuntime.version,
      node_compat_version: process.version
    };
  }

  return {
    process_uptime_sec: roundMs(process.uptime()),
    runtime_name: 'node' as const,
    runtime_version: process.version,
    node_compat_version: process.version
  };
}

export const GET: RequestHandler = async () => {
  const requestStart = performance.now();
  logInfo('health.check.start');

  const runtime = tracer.startActiveSpan('health.runtime.snapshot', (span) => {
    const snapshot = runtimeSnapshot();

    span.setAttributes({
      'health.runtime.process_uptime_sec': snapshot.process_uptime_sec,
      'health.runtime.runtime_name': snapshot.runtime_name,
      'health.runtime.runtime_version': snapshot.runtime_version,
      'health.runtime.node_compat_version': snapshot.node_compat_version
    });
    span.end();

    logInfo('health.runtime.snapshot', snapshot);
    return snapshot;
  });

  let dbStatus: 'ok' | 'error' = 'ok';
  let dbPingMs = 0;

  await tracer.startActiveSpan('health.db.ping', async (span) => {
    const dbStart = performance.now();
    try {
      await sqlClient`SELECT 1 AS ok`;
      dbPingMs = roundMs(performance.now() - dbStart);
      span.setAttribute('health.db.ok', true);
      span.setAttribute('health.db.ping_ms', dbPingMs);
      logInfo('health.db.ping.ok', { db_ping_ms: dbPingMs });
      recordHealthDbPingDuration(dbPingMs, 'ok');
    } catch (error) {
      dbStatus = 'error';
      dbPingMs = roundMs(performance.now() - dbStart);
      const message = error instanceof Error ? error.message : 'database ping failed';

      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message });
      span.setAttribute('health.db.ok', false);
      span.setAttribute('health.db.ping_ms', dbPingMs);

      logError('health.db.ping.error', { error: message, db_ping_ms: dbPingMs });
      recordHealthDbPingDuration(dbPingMs, 'error');
      recordHealthDbPingFailure();
    } finally {
      span.end();
    }
  });

  const healthStatus = dbStatus === 'ok' ? 'ok' : 'degraded';
  const totalMs = roundMs(performance.now() - requestStart);

  recordHealthRequest(healthStatus);
  recordHealthRequestDuration(totalMs, healthStatus);

  logInfo('health.check.complete', {
    status: healthStatus,
    duration_ms: totalMs,
    db_ping_ms: dbPingMs
  });

  return json(
    {
      status: healthStatus,
      ts: new Date().toISOString(),
      checks: {
        db: dbStatus
      },
      runtime
    },
    { status: healthStatus === 'ok' ? 200 : 503 }
  );
};
