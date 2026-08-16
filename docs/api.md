# API

## General

- **Base URL (development)**: `http://localhost:4000`
- Content type: `application/json`
- No business endpoints exist yet.

## Endpoints

| Method | Path      | Description                                |
| ------ | --------- | ------------------------------------------ |
| `GET`  | `/health` | Liveness check. Returns `{"status":"ok"}`. |

## Conventions (to be followed as endpoints are added)

- Each feature owns its routes: `backend/src/modules/<feature>/<feature>.routes.ts`.
- Route handlers are thin: parsing -> validation -> controller/service -> response.
- Errors are handled consistently through `backend/src/core/errors` (to be implemented).
- Shared response/error shapes live in `backend/src/core/http` (to be implemented).
- Endpoint documentation is kept in sync with this file as features land.
