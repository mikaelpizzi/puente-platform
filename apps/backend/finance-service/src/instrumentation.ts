import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource, envDetector, hostDetector, osDetector } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

declare global {
  var __otelSdkInitialized: boolean | undefined;
}

const nodeOptions = process.env.NODE_OPTIONS || '';
const autoInstrumentationViaNodeOptions = nodeOptions.includes(
  '@opentelemetry/auto-instrumentations-node/register',
);

const shouldInitialize =
  process.env.NODE_ENV !== 'test' &&
  process.env.OTEL_SDK_DISABLED !== 'true' &&
  !autoInstrumentationViaNodeOptions;

const parseKeyValuePairs = (raw?: string | null) => {
  if (!raw) return {} as Record<string, string>;

  return raw
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .reduce(
      (acc, segment) => {
        const [key, ...rest] = segment.split('=');
        if (!key || rest.length === 0) {
          return acc;
        }
        acc[key.trim()] = rest.join('=').trim();
        return acc;
      },
      {} as Record<string, string>,
    );
};

const buildOtlpHeaders = () => {
  const parsed = parseKeyValuePairs(process.env.OTEL_EXPORTER_OTLP_HEADERS);
  if (Object.keys(parsed).length > 0) {
    return parsed;
  }

  if (process.env.OTEL_AUTH_HEADER) {
    return { Authorization: process.env.OTEL_AUTH_HEADER };
  }

  return undefined;
};

const resolveResourceAttributes = () => {
  const envAttributes = parseKeyValuePairs(process.env.OTEL_RESOURCE_ATTRIBUTES);
  const serviceName =
    envAttributes[SemanticResourceAttributes.SERVICE_NAME] ||
    process.env.OTEL_SERVICE_NAME ||
    'puente-finance-service';

  const serviceNamespace =
    envAttributes[SemanticResourceAttributes.SERVICE_NAMESPACE] ||
    process.env.OTEL_SERVICE_NAMESPACE ||
    'my-application-group';

  const deploymentEnvironment =
    envAttributes[SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT] ||
    process.env.OTEL_DEPLOYMENT_ENVIRONMENT ||
    process.env.NODE_ENV ||
    'development';

  return {
    ...envAttributes,
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    [SemanticResourceAttributes.SERVICE_NAMESPACE]: serviceNamespace,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: deploymentEnvironment,
  };
};

const resolveResourceDetectors = () => {
  const detectorsMap = {
    env: envDetector,
    host: hostDetector,
    os: osDetector,
  } as const;

  const requested = (process.env.OTEL_NODE_RESOURCE_DETECTORS || '')
    .split(',')
    .map((detector) => detectorsMap[detector.trim() as keyof typeof detectorsMap])
    .filter(Boolean);

  return requested.length ? requested : undefined;
};

const buildTraceExporter = () => {
  const exporter = (process.env.OTEL_TRACES_EXPORTER || 'otlp').toLowerCase();
  if (exporter !== 'otlp' || !process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    return undefined;
  }

  return new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    headers: buildOtlpHeaders(),
  });
};

if (shouldInitialize && !global.__otelSdkInitialized) {
  global.__otelSdkInitialized = true;

  const diagLevel = process.env.OTEL_DEBUG === 'true' ? DiagLogLevel.DEBUG : DiagLogLevel.ERROR;
  diag.setLogger(new DiagConsoleLogger(), diagLevel);

  const sdk = new NodeSDK({
    resource: new Resource(resolveResourceAttributes()),
    traceExporter: buildTraceExporter(),
    resourceDetectors: resolveResourceDetectors(),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  const startSdk = async () => {
    try {
      await sdk.start();
    } catch (error: unknown) {
      console.error('Failed to initialize OpenTelemetry SDK', error);
    }
  };

  void startSdk();

  const shutdown = () => {
    const stopSdk = async () => {
      try {
        await sdk.shutdown();
      } catch (error: unknown) {
        console.error('Error shutting down OpenTelemetry SDK', error);
      } finally {
        process.exit(0);
      }
    };

    void stopSdk();
  };

  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}
