export type OtlpProtocol = 'http/protobuf' | 'grpc';

export interface ObservabilityConfig {
  serviceName: string;
  protocol: OtlpProtocol;
  endpoint: string;
}

export function getObservabilityConfig(): ObservabilityConfig {
  const protocol = (process.env.OTEL_EXPORTER_OTLP_PROTOCOL ?? 'http/protobuf') as OtlpProtocol;

  if (protocol !== 'http/protobuf' && protocol !== 'grpc') {
    throw new Error(`Unsupported OTLP protocol: ${protocol}`);
  }

  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? (protocol === 'grpc' ? 'http://localhost:4317' : 'http://localhost:4318');

  return {
    serviceName: process.env.OTEL_SERVICE_NAME ?? 'vntq-api',
    protocol,
    endpoint
  };
}

