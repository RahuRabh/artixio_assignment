# Artixio Regulatory Decision Layer

Single-page compliance triage workspace built as a `pnpm` monorepo with:
- `frontend`: React + Vite + Tailwind + Shadcn-style UI + TanStack Query/Table
- `backend`: Express + TypeScript + Prisma + Zod
- `shared`: shared API contracts and enums

## Monorepo Structure

```text
.
├── backend
│   ├── prisma
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src
│   │   ├── app.ts
│   │   ├── index.ts
│   │   ├── lib
│   │   ├── modules
│   │   └── routes
│   └── tests
├── frontend
│   └── src
│       ├── components
│       ├── hooks
│       └── lib
├── shared
│   └── src
├── docker-compose.yml
├── package.json
└── pnpm-workspace.yaml
```

## 5-Minute Local Setup

1. Install dependencies:

```bash
pnpm install
```

2. Copy environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Start PostgreSQL:

```bash
pnpm db:up
```

4. Generate Prisma client, push schema, and seed:

```bash
pnpm db:generate
pnpm db:push
pnpm db:seed
```

5. Start the full stack:

```bash
pnpm dev
```

Frontend runs at `http://localhost:5173` and backend at `http://localhost:4000`.

## Environment Variables

### Backend

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/artixio_regulatory?schema=public"
PORT=4000
FRONTEND_ORIGIN="http://localhost:5173"
```

### Frontend

```env
VITE_API_BASE_URL="http://localhost:4000"
```

## Schema Overview

```mermaid
erDiagram
  RegulatoryAuthority ||--o{ ComplianceDirective : owns
  ComplianceDirective ||--o{ ActionItem : tracks

  RegulatoryAuthority {
    string id
    string code
    string name
    string region
    string website
  }

  ComplianceDirective {
    string id
    string authorityId
    string title
    string summary
    enum riskLevel
    datetime effectiveDate
    json rawPayload
  }

  ActionItem {
    string id
    string directiveId
    string title
    string assignedTo
    enum status
    enum priority
    datetime dueDate
    text flagReason
  }
```

## Intentional Messy Data

| Anomaly Type | Injection Strategy | Expected Rate | Backend Handling |
| --- | --- | --- | --- |
| Missing `effectiveDate` | Fixed set of 6 directives out of 48 | 12.5% | Mark directive anomalous, preserve record, return `effectiveDate: null` |
| Missing `dueDate` | Every 9th action item | About 11% | Add `Missing mandatory due date` to anomalies |
| Conflicting resolved state | Every 11th eligible action item becomes `RESOLVED` with overdue date and no note | About 10% | Add `Conflicting state: resolved item is overdue without resolution notes` |
| Malformed payloads | 4 directives with metadata drift, unsupported version, or source schema damage | 8.3% | Set health to `CORRUPT_PAYLOAD`, keep safe fallback JSON for rendering |

## API Summary

### `GET /api/directives`
- Supports `search`, `riskLevel`, `status`, `authorityCode`, `anomaliesOnly`, `page`, `pageSize`
- Returns paginated normalized directives
- Sanitizes messy data instead of dropping it

### `PATCH /api/action-items/:id/status`
- Validates state transitions:
  - `PENDING -> IN_REVIEW`
  - `PENDING -> REJECTED`
  - `IN_REVIEW -> RESOLVED`
  - `IN_REVIEW -> REJECTED`
- Returns updated action item plus recomputed directive health metadata

### `GET /api/analytics/summary`
- Returns:
  - total directives
  - pending action items
  - high/critical directives
  - flagged anomalies

## Frontend UX Notes

- Single-screen workstation layout with dense table rows
- Debounced search and multi-filter toolbar
- Inline action status mutation with optimistic update
- Right-side detail drawer preserves active filters and table context
- Visual health system:
  - `Clean`
  - `Anomaly`
  - `Corrupt Payload`

## Testing

Backend test coverage included:
- status transition validation
- directive normalization for malformed payloads and conflicting states

Run tests with:

```bash
pnpm test
```

## Loom Talking Points Outline

1. Start with the data model and explain why `rawPayload` stays flexible while relational entities remain strict.
2. Show the seed strategy and call out how missing dates, conflicting states, and malformed payloads are deliberately injected.
3. Walk through the backend sanitization layer and explain why corrupted records are transformed instead of rejected.
4. Demo the SPA triage flow: search, filter, anomaly-only mode, inline status change, and drawer inspection.
5. Close with an AI-tooling example:
   Mention that one bug surfaced while wiring optimistic updates and shared contracts, and the fix was to return recomputed directive metadata from the PATCH route so the client could reconcile anomaly badges without a full page reload.
