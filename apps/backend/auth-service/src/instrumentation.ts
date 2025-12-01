import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

declare global {
  var __otelSdkInitialized: boolean | undefined;
}

const shouldInitialize =
  process.env.NODE_ENV !== 'test' && process.env.OTEL_SDK_DISABLED !== 'true';

if (shouldInitialize && !global.__otelSdkInitialized) {
  global.__otelSdkInitialized = true;

  const diagLevel = process.env.OTEL_DEBUG === 'true' ? DiagLogLevel.DEBUG : DiagLogLevel.ERROR;
  diag.setLogger(new DiagConsoleLogger(), diagLevel);

  const otlpHeaders = process.env.OTEL_AUTH_HEADER
    ? {
        Authorization: process.env.OTEL_AUTH_HEADER,
      }
    : undefined;

  const traceExporter = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    ? new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
        headers: otlpHeaders,
      })
    : undefined;

  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]:
        process.env.OTEL_SERVICE_NAME || 'puente-auth-service',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
    }),
    traceExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-http': {
          ignoreIncomingPaths: [/health/, /metrics/],
        },
        '@opentelemetry/instrumentation-prisma': {
          enabled: true,
        },
      }),
    ],
  });

  sdk.start().catch((error) => {
    console.error('Failed to initialize OpenTelemetry SDK', error);
  });

  const shutdown = () => {
    sdk
      .shutdown()
      .catch((error) => console.error('Error shutting down OpenTelemetry SDK', error))
      .finally(() => process.exit(0));
  };

  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}
