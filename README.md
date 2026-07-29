# city-automation

Orchestration service for City Mortgage AI Platform. Calls city-outlook-service
via service binding — no duplicated business logic.

## Endpoints
- GET  /health
- POST /process-latest   — one email, pass-through to outlook-service
- POST /process-history  — all unread emails, queue + retry, returns summary

## Bindings
- CITY_OUTLOOK (service binding to city-outlook-service)

## Not yet enabled
Cron Trigger for scheduled /process-latest runs. Endpoint is manual-call-only
by design; add a `triggers.crons` entry in wrangler.jsonc later to enable
scheduled execution — no code change needed for that switch.
