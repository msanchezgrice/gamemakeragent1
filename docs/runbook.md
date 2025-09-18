# Operations Runbook

## Human Approval Gates

| Phase | Trigger | Required Action |
|-------|---------|-----------------|
| Prioritize | Run enters `awaiting_human` with `portfolio_approval` task | Review market brief artifact, approve or reject candidates. |
| QA | QA autoplayer finished | Execute manual playtest checklist, attach notes, mark task complete. |
| Deploy | Publisher prepared bundle | Upload assets to Clipcade admin, confirm metadata, close task. |

Use the operator console inbox to track outstanding tasks. Runs do not resume until all blockers are cleared.

## Manual Theme Input

While market data integrations are stubbed, operators must supply `theme` and `targetGameTypes` when creating runs. Recommended presets:
- runner
- blockbreaker
- match3
- snake
- educational_math
- educational_colors

## Notifications

Notifications remain in-app only. Orchestrator posts new tasks to the inbox stream with timestamps and quick links to the relevant run.

## CLI Snippets

```
# Create a run (dev server)
curl -X POST http://localhost:3333/runs \
  -H 'Content-Type: application/json' \
  -d '{"brief":{"industry":"hyper casual","goal":"explore math runners","theme":"math runner","constraints":{}}}'

# Advance a run (respects blockers)
curl -X POST http://localhost:3333/runs/<runId>/advance
```
