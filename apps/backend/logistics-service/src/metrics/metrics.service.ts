import { Injectable } from '@nestjs/common';
import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';

export type TelemetryIngestSource = 'rest' | 'ws';

@Injectable()
export class MetricsService {
  private readonly registry = new Registry();
  private readonly ingestCounter = new Counter({
    name: 'logistics_telemetry_ingest_total',
    help: 'Total telemetry updates accepted by source.',
    labelNames: ['source'] as const,
    registers: [this.registry],
  });
  private readonly throttledCounter = new Counter({
    name: 'logistics_telemetry_throttled_total',
    help: 'Telemetry updates rejected due to throttling.',
    labelNames: ['source'] as const,
    registers: [this.registry],
  });
  private readonly ingestDuration = new Histogram({
    name: 'logistics_telemetry_ingest_duration_ms',
    help: 'Processing time for telemetry updates in milliseconds.',
    labelNames: ['source'] as const,
    buckets: [5, 10, 25, 50, 75, 100, 250, 500, 1000, 2000],
    registers: [this.registry],
  });

  constructor() {
    collectDefaultMetrics({ register: this.registry });
  }

  observeIngest(source: TelemetryIngestSource, durationMs: number): void {
    this.ingestCounter.labels(source).inc();
    this.ingestDuration.labels(source).observe(durationMs);
  }

  incrementThrottled(source: TelemetryIngestSource): void {
    this.throttledCounter.labels(source).inc();
  }

  async getSnapshot(): Promise<string> {
    return this.registry.metrics();
  }

  get contentType(): string {
    return this.registry.contentType;
  }
}
