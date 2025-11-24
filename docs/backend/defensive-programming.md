# Defensive Programming Policies

## Sanity Checks for GET/DELETE Requests

- **Requirement**: Every HTTP-facing service must reject GET and DELETE requests that include a request body. Enforce this at the middleware layer before authentication, proxying, or controller logic runs. This policy applies to the entire Puente Platform (API Gateway, domain services, and any future adapters).
- **Reference Implementation**: `apps/backend/api-gateway/src/middleware/sanity-check.middleware.ts` is already registered globally in `apps/backend/api-gateway/src/app.module.ts`, ensuring the gateway fails fast with HTTP 400 when clients send bodies with GET/DELETE.
- **Action Items for Other Services**: Replicate or import the same middleware in each NestJS service (auth, products, finance, logistics, etc.) so the behavior stays consistent everywhere. Until each service wires it in, they remain out of compliance with this platform-level policy.
- **Testing Expectation**: Add integration or e2e tests per service that assert GET/DELETE requests with bodies produce a 400 response. This prevents regressions when middleware stacks change.
