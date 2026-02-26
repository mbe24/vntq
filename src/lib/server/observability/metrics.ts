import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('vntq-server');

const healthRequestsCounter = meter.createCounter('vntq_health_requests_total', {
  description: 'Total number of /health requests handled by vntq.',
  unit: '{request}'
});

const healthRequestDurationHistogram = meter.createHistogram('vntq_health_request_duration_ms', {
  description: 'Duration of /health request handling in milliseconds.',
  unit: 'ms'
});

const healthDbPingDurationHistogram = meter.createHistogram('vntq_health_db_ping_duration_ms', {
  description: 'Duration of the database ping executed during /health handling in milliseconds.',
  unit: 'ms'
});

const healthDbPingFailuresCounter = meter.createCounter('vntq_health_db_ping_failures_total', {
  description: 'Total number of /health database ping failures.',
  unit: '{failure}'
});

export function recordHealthRequest(status: 'ok' | 'degraded'): void {
  healthRequestsCounter.add(1, { status });
}

export function recordHealthRequestDuration(durationMs: number, status: 'ok' | 'degraded'): void {
  healthRequestDurationHistogram.record(durationMs, { status });
}

export function recordHealthDbPingDuration(durationMs: number, status: 'ok' | 'error'): void {
  healthDbPingDurationHistogram.record(durationMs, { status });
}

export function recordHealthDbPingFailure(): void {
  healthDbPingFailuresCounter.add(1);
}

