# GameTok Multi-Agent Orchestrator

This repo hosts the pnpm workspace for the GameTok / Clipcade multi-agent pipeline. The system runs automated workflows for market research, game generation, QA, and deployment while flagging human approval gates before sensitive actions.

## Workspace Layout

```
apps/console            Operator console (Next.js/App Router) for monitoring runs
services/orchestrator   Node/TypeScript state machine + job runner
packages/               Shared libraries (agents, schemas, experiment math, game adapter, utils)
supabase/               SQL migrations and seed data for orchestrator tables
infra/                  CI workflows and operational scripts
docs/                   Specs, runbooks, design references
```

## Human-in-the-loop Stop Points

Automated jobs pause and raise an in-app task card before continuing through the following phases:
- **Portfolio Approval** – sign off on which game briefs proceed to build.
- **QA Verification** – confirm generated bundles function as expected before publish.
- **Deployment Upload** – manually upload bundles to Clipcade until the API path is enabled.

The orchestrator emits notifications through the operator console inbox; no external channels are used yet.

## Getting Started

1. Install pnpm `>=8.15`.
2. Copy `.env.example` to `.env` (root) and populate values.
3. Run `pnpm install`.
4. For the operator console: `pnpm dev:console`. For the orchestrator: `pnpm dev:orchestrator`.

Local execution is optional; CI and GitHub deployments can execute the same commands in Vercel/Supabase backed environments.

## Status

- Phase 0 scaffolding in progress (workspace + tooling)
- External data sources are stubbed; operators supply target game themes manually.
- Manual Clipcade uploads remain the final deployment step.

Refer to `docs/runbook.md` (to be added) for detailed operating procedures.
