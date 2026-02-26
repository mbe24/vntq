import { context, diag, DiagConsoleLogger, DiagLogLevel, metrics, trace } from '@opentelemetry/api';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import { OTLPLogExporter as OTLPGrpcLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc';
import { OTLPLogExporter as OTLPHttpLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPMetricExporter as OTLPGrpcMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { OTLPMetricExporter as OTLPHttpMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter as OTLPGrpcTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPTraceExporter as OTLPHttpTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

import { getObservabilityConfig } from './config';

declare global {
  // eslint-disable-next-line no-var
  var __vntqObservabilityStarted: boolean | undefined;
}

let started = globalThis.__vntqObservabilityStarted === true;
let otelLogger = logs.getLogger('vntq-server');

export function initObservability(): void {
  if (started) {
    return;
  }

  started = true;
  globalThis.__vntqObservabilityStarted = true;
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

  const config = getObservabilityConfig();
  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName
  });

  const tracerProvider = new NodeTracerProvider({ resource });
  if (config.protocol === 'grpc') {
    tracerProvider.addSpanProcessor(new BatchSpanProcessor(new OTLPGrpcTraceExporter({ url: config.endpoint })));
  } else {
    tracerProvider.addSpanProcessor(
      new BatchSpanProcessor(
        new OTLPHttpTraceExporter({
          url: otlpHttpSignalUrl(config.endpoint, 'traces')
        })
      )
    );
  }
  tracerProvider.register();

  const loggerProvider = new LoggerProvider({ resource });
  if (config.protocol === 'grpc') {
    loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(new OTLPGrpcLogExporter({ url: config.endpoint })));
  } else {
    loggerProvider.addLogRecordProcessor(
      new BatchLogRecordProcessor(
        new OTLPHttpLogExporter({
          url: otlpHttpSignalUrl(config.endpoint, 'logs')
        })
      )
    );
  }
  logs.setGlobalLoggerProvider(loggerProvider);
  otelLogger = logs.getLogger('vntq-server');

  const meterProvider = new MeterProvider({ resource });
  if (config.protocol === 'grpc') {
    meterProvider.addMetricReader(
      new PeriodicExportingMetricReader({
        exporter: new OTLPGrpcMetricExporter({ url: config.endpoint }),
        exportIntervalMillis: 5000
      })
    );
  } else {
    meterProvider.addMetricReader(
      new PeriodicExportingMetricReader({
        exporter: new OTLPHttpMetricExporter({
          url: otlpHttpSignalUrl(config.endpoint, 'metrics')
        }),
        exportIntervalMillis: 5000
      })
    );
  }
  metrics.setGlobalMeterProvider(meterProvider);
}

function otlpHttpSignalUrl(baseEndpoint: string, signal: 'traces' | 'logs' | 'metrics'): string {
  const trimmed = baseEndpoint.replace(/\/+$/, '');
  return `${trimmed}/v1/${signal}`;
}

type Attributes = Record<string, string | number | boolean | null>;
type ConsoleFormat = 'json' | 'pretty';

function getConsoleFormat(): ConsoleFormat {
  const configured = process.env.LOG_FORMAT;
  if (configured === 'json' || configured === 'pretty') {
    return configured;
  }
  return process.env.NODE_ENV === 'production' ? 'json' : 'pretty';
}

function traceAttributes(): Attributes {
  const span = trace.getActiveSpan();
  if (!span) {
    return {};
  }
  const active = span.spanContext();
  return {
    trace_id: active.traceId,
    span_id: active.spanId
  };
}

function emit(severityText: 'INFO' | 'WARN' | 'ERROR', message: string, attributes: Attributes = {}): void {
  const combinedAttributes = { ...traceAttributes(), ...attributes };
  const payload = {
    ts: new Date().toISOString(),
    severity: severityText,
    message,
    ...combinedAttributes
  };

  const format = getConsoleFormat();
  if (format === 'pretty') {
    const extra = Object.entries(combinedAttributes)
      .map(([key, value]) => `${key}=${String(value)}`)
      .join(' ');
    console.log(`[${payload.ts}] ${payload.severity} ${payload.message}${extra ? ` ${extra}` : ''}`);
  } else {
    console.log(JSON.stringify(payload));
  }

  otelLogger.emit({
    severityNumber:
      severityText === 'ERROR'
        ? SeverityNumber.ERROR
        : severityText === 'WARN'
          ? SeverityNumber.WARN
          : SeverityNumber.INFO,
    severityText,
    body: message,
    attributes: combinedAttributes,
    context: context.active()
  });
}

export function logInfo(message: string, attributes: Attributes = {}): void {
  emit('INFO', message, attributes);
}

export function logWarn(message: string, attributes: Attributes = {}): void {
  emit('WARN', message, attributes);
}

export function logError(message: string, attributes: Attributes = {}): void {
  emit('ERROR', message, attributes);
}
