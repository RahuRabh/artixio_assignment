# Artixio Regulatory Decision Layer

Single-page compliance triage workspace built as a `pnpm` monorepo with:
- `frontend`: React + Vite + Tailwind + Shadcn-style UI + TanStack Query/Table
- `backend`: Express + TypeScript + Prisma + Zod
- `shared`: shared API contracts and enums

This assessment is designed as a high-density single-page decision-layer application for a regulatory compliance officer. The goal is to surface messy real-world regulatory updates, preserve corrupted records safely, and support fast triage without breaking the operator's workflow.

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
FRONTEND_ORIGINS="http://localhost:5173,https://artixio-assignment-frontend.vercel.app"
```

### Frontend

```env
VITE_API_BASE_URL="http://localhost:4000"
```

## Schema Overview

The schema separates stable relational workflow entities from flexible source ingestion data:
- `RegulatoryAuthority` is the source-of-truth table for agencies such as FDA, EMA, and MHRA.
- `ComplianceDirective` stores the operational regulatory update and links it back to its authority.
- `ActionItem` captures downstream review and remediation work generated from each directive.
- `rawPayload` intentionally remains JSON so the system can store inconsistent AI-extracted or source-ingested data without forcing a brittle rigid schema at ingestion time.

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
- Selection checkboxes are included as bulk-triage scaffolding for future actions like assign, export, or batch review
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

## Deploying Backend To Render

The backend needs Prisma Client to be generated during the Render build. This repo now does that automatically through the backend `postinstall` and `build` scripts.

Recommended Render setup for the backend service:

1. Root Directory: repository root
2. Build Command:

```bash
corepack enable && pnpm install && pnpm --filter @artixio/shared build && pnpm --filter @artixio/backend build
```

3. Start Command:

```bash
pnpm --filter @artixio/backend start
```

4. Environment Variables:

```env
DATABASE_URL=<your-render-postgres-internal-or-external-url>
PORT=10000
FRONTEND_ORIGIN=<your-vercel-frontend-url>
FRONTEND_ORIGINS=<optional-comma-separated-extra-origins>
```

Important notes:
- Do not use `prisma db push` on Render startup. For deployed environments, prefer `prisma migrate deploy` once you introduce migrations.
- `@prisma/client did not initialize yet` means Render started the server without a generated Prisma client in `node_modules/.prisma`.
- If Render is building only the `backend` directory, installation can also fail or behave inconsistently because the backend depends on the local workspace package `@artixio/shared`.
- The Prisma schema line in this project should remain:

```prisma
url = env("DATABASE_URL")
```

If you see an error like `env("DATABASE_URL:)`, that usually means the value was copied with broken quotes or a missing closing quote somewhere during editing or in the deployment UI. The schema property `url` is still valid inside the `datasource db` block.

## 2-3 Minute Loom Script

Hi, this is my Artixio technical assessment submission. I built a single-page decision-layer application for a regulatory compliance officer who needs to review messy, fast-moving regulatory updates in a dense workstation-style interface.

At a technical level, the project is organized as a `pnpm` monorepo with a React frontend, an Express and TypeScript backend, PostgreSQL with Prisma, and a small shared package that keeps the frontend and backend aligned on enums, Zod schemas, and API contracts.

The data model has three relational entities. `RegulatoryAuthority` stores agencies like FDA and EMA. `ComplianceDirective` stores the regulatory update itself, including a flexible `rawPayload` JSON field. `ActionItem` stores the operational follow-up work for each directive. I kept `rawPayload` as JSON intentionally, because in this domain the incoming data is often inconsistent, partially extracted, or structurally messy.

To make that realistic, the seed script generates 48 directives with intentional anomalies. Around twelve percent have missing effective dates, about ten percent contain conflicting resolved states with overdue dates and no supporting note, and a smaller set have malformed payload structures or unsupported schema versions.

On the backend, I built a sanitization layer with Zod. Instead of dropping bad records or crashing, the API normalizes every directive into a safe UI model, adds `hasAnomaly`, assigns a data health state, and returns specific anomaly messages like missing due date or corrupt payload metadata. That lets the system stay operational even when the source data is imperfect.

On the frontend, the app is a single-screen triage workspace. The top strip shows metrics, the toolbar supports debounced search and filtering, the main grid is built for dense review, and the right-side drawer lets the user inspect anomalies and raw payload details without losing their table context. Inline action status changes use optimistic updates so the interface feels fast.

One useful AI-assisted debugging example came up during implementation and deployment. I found that optimistic updates needed directive-level metadata returned from the PATCH endpoint, otherwise anomaly badges could drift from the real backend state. I also resolved a Prisma deployment issue by making client generation happen during build and by separating the app's Docker Postgres port from a conflicting local database port.

Overall, I aimed to build something that feels realistic for regulatory operations: resilient to messy data, quick to scan, and safe under imperfect inputs.
