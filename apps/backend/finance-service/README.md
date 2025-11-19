# Finance Service

Microservice for handling Orders, Ledger, and Commissions.

## Setup

1.  Ensure PostgreSQL is running.
2.  Copy `.env.example` to `.env` (if needed) and set `DATABASE_URL`.
3.  Run migrations:
    ```bash
    npx prisma migrate dev
    ```

## Testing

Run unit tests:

```bash
pnpm test
```

## Saga Pattern

The service supports the Saga pattern via the `compensateOrder` method.
If a distributed transaction fails, call:
`POST /finance/orders/:id/compensate`
with a reason. This will mark the order as FAILED and reverse the ledger entries.
