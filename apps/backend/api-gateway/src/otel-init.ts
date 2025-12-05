const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

const exporter = new OTLPTraceExporter({
  url: 'https://otlp-gateway-prod-us-east-2.grafana.net/otlp/v1/traces',
  headers: {
    Authorization:
      'Basic MTQ1NDU3NDpnbGNfZXlKdklqb2lNVFl3TkRNd09TSXNJbTRpT2lKdVpYY3RkRzlyWlc0aUxDSnJJam9pVDJKVVJrZzJWV1oyV0RsdFlVRXdNek0xTmpRM1Z6VllJaXdpYlNJNmV5SnlJam9pY0hKdlpDMTFjeTFsWVhOMExUQWlmWDA9',
  },
});

const sdk = new NodeSDK({
  traceExporter: exporter,
  instrumentations: [getNodeAutoInstrumentations()],
  serviceName: 'puente-gateway',
  serviceVersion: '1.0.0',
});

sdk.start();
console.log('✅ OpenTelemetry SDK iniciado - Exportando trazas a Grafana Cloud');

process.on('SIGTERM', () => {
  sdk.shutdown().finally(() => process.exit(0));
});
