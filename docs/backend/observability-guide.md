# Observability Guide — OpenTelemetry + Grafana Cloud

This guide explains how to navigate traces, logs, and alerts in Grafana Cloud for the Puente Platform backend services.

## Prerequisites

- Grafana Cloud account (free tier available at [grafana.com](https://grafana.com))
- Backend services running with `OTEL_*` environment variables configured (see `.env.example`)

## Environment Variables

Each service reads these variables from the environment:

| Variable                      | Description                     | Example                                                |
| ----------------------------- | ------------------------------- | ------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP collector endpoint         | `https://otlp-gateway-prod-us-east-2.grafana.net/otlp` |
| `OTEL_EXPORTER_OTLP_HEADERS`  | Auth header for Grafana         | `Authorization=Basic <base64>`                         |
| `OTEL_SERVICE_NAME`           | Service identifier in traces    | `puente-api-gateway`                                   |
| `OTEL_SDK_DISABLED`           | Set `true` to disable telemetry | `false`                                                |

## Navigating Traces in Grafana Tempo

1. **Open Explore**: In Grafana Cloud, go to **Explore** (compass icon).
2. **Select Data Source**: Choose your Tempo data source.
3. **Search by Service**: Use the query builder:
   - `resource.service.name = "puente-api-gateway"`
   - Filter by `http.status_code`, `http.method`, or `http.route`
4. **Find a Trace by ID**: Paste the `traceId` from logs into the search bar.
5. **Analyze Spans**: Click on a trace to see the waterfall view:
   - Total duration
   - Each service hop (Gateway → Auth → Products, etc.)
   - Database queries (Prisma, Mongoose)
   - Redis operations

### Common Queries

| Goal                    | Query                                                                     |
| ----------------------- | ------------------------------------------------------------------------- |
| All errors from Gateway | `resource.service.name = "puente-api-gateway" && http.status_code >= 500` |
| Slow requests (>1s)     | `duration > 1s`                                                           |
| Specific endpoint       | `http.route = "/auth/login"`                                              |

## Correlating Logs with Traces

Each log line includes `traceId` and `spanId` fields (injected by `nestjs-pino`):

```json
{
  "level": "info",
  "time": 1701700000000,
  "msg": "User registered",
  "traceId": "abc123...",
  "spanId": "def456...",
  "req": { "method": "POST", "url": "/auth/register" }
}
```

**To correlate**:

1. Find a log entry with an error or interesting event.
2. Copy the `traceId` value.
3. In Tempo Explore, paste the `traceId` to see the full request journey.

## Setting Up Basic Alerts

### Alert 1: High Error Rate

1. Go to **Alerting** → **Alert rules** → **New alert rule**.
2. **Data source**: Select your metrics/logs source.
3. **Query**:
   ```promql
   sum(rate(http_server_requests_total{status=~"5.."}[5m]))
   /
   sum(rate(http_server_requests_total[5m])) > 0.05
   ```
4. **Condition**: Fire when error rate > 5%.
5. **Notification**: Add a Slack/email channel.

### Alert 2: High Latency (P99 > 500ms)

1. Create a new alert rule.
2. **Query**:
   ```promql
   histogram_quantile(0.99, sum(rate(http_server_request_duration_seconds_bucket[5m])) by (le)) > 0.5
   ```
3. **Condition**: Fire when P99 latency exceeds 500ms.

### Alert 3: Service Down

1. **Query**: Use Tempo service graph or health endpoint probing.
2. **Condition**: No traces from `service.name` in 5 minutes.

## Recommended Dashboards

Import these community dashboards for quick visibility:

| Dashboard            | ID    | Purpose                                 |
| -------------------- | ----- | --------------------------------------- |
| NestJS OpenTelemetry | 17900 | Request/error rates, latency histograms |
| Redis Overview       | 763   | Redis connection metrics                |
| PostgreSQL Overview  | 9628  | Prisma connection pool, query times     |

**To import**:

1. Go to **Dashboards** → **Import**.
2. Enter the dashboard ID.
3. Select your data sources.

## Troubleshooting

### No traces appearing

1. Verify `OTEL_SDK_DISABLED` is not `true`.
2. Check `OTEL_EXPORTER_OTLP_ENDPOINT` is correct.
3. Ensure the auth header in `OTEL_EXPORTER_OTLP_HEADERS` is valid.
4. Look for `✅ OpenTelemetry SDK iniciado` in service startup logs.

### Traces missing spans

1. Confirm all services have instrumentation enabled.
2. Verify the `traceparent` header propagates through proxies.
3. Check that `@opentelemetry/auto-instrumentations-node` is installed.

### Logs not showing traceId

1. Ensure `LoggerModule.forRoot()` is registered in `app.module.ts`.
2. Verify `main.ts` uses `app.useLogger(app.get(Logger))`.

## Next Steps

- [ ] Create custom dashboards for business KPIs (orders/min, payments processed).
- [ ] Add Sentry integration for error grouping (see Task 29).
- [ ] Configure PagerDuty/OpsGenie for on-call alerting.
