# Entrega Certa Web

Web app used by a non-profit to run its food basket program: families on the waiting list, monthly distributions, check-in and pickup, inventory, basket planning and assembly, reports and audit.

Built with **Angular 21 (standalone + Signals)** on top of a layered architecture, with route guards driven by the user's permissions.

> 🇧🇷 Documentação em português: [docs/README.pt-BR.md](docs/README.pt-BR.md) e a pasta [`docs/`](docs).

**Live demo:** [pastoral-fronted-ashy.vercel.app](https://pastoral-fronted-ashy.vercel.app) · read-only account `demo` / `senhaTeste`
**Backend API:** [gabrielmdss/entrega_certa_backend_v3](https://github.com/gabrielmdss/entrega_certa_backend_v3)

> The API runs on Render's free tier: the first login may take up to a minute while it wakes up.

## Features

- **Dashboard** with operational indicators: open spots, inventory coverage and upcoming distributions.
- **Assistance**: people and beneficiaries, waiting list with prioritization, global capacity and group changes.
- **Distributions**: monthly entitlements, check-in, pickups and reversals, extra baskets and absence justifications.
- **Inventory**: items, stock entries and losses, inventory counts, basket models, planning, assembly and release to distributions.
- **Administration**: users and roles, audit log and per-record history.
- **Access control**: protected routes declare the permission they need; users without it are redirected to an "access denied" page instead of hitting API errors.

## Architecture

```text
presentation  →  application  →  ports  ←  infrastructure
                      │
                   domain            main = composition root
```

| Layer | Responsibility |
|---|---|
| `domain` | Business models. No Angular dependency. |
| `application` | Use cases and ports (interfaces) per feature. |
| `infrastructure` | HTTP adapters, DTOs and mappers, auth session storage, runtime config. |
| `presentation` | Lazy-loaded pages and components. |
| `main` | Routes, providers and app bootstrap. |
| `shared` | UI kit, pipes, theme and error handling. |

Highlights:

- **Signals** for local state, no global store.
- **Runtime configuration**: the API URL is loaded from `/config.json` before bootstrap, so the same build runs in any environment.
- **Search UX**: debounce, `distinctUntilChanged`, cancellation with `switchMap` and server-side filtering.
- **Session restore** through `/auth/me` on startup, with HTTP interceptors attaching the token.

More detail in [docs/architecture.md](docs/architecture.md), [docs/routing.md](docs/routing.md) and [docs/api-integration.md](docs/api-integration.md).

## Tech stack

| Area | Tools |
|---|---|
| Framework | Angular 21, standalone components, Signals, RxJS |
| Language | TypeScript (strict) |
| Quality | Vitest + jsdom (56 spec files), ESLint with angular-eslint, Prettier |
| Deploy | Vercel (static SPA); PM2 scripts for on-premise hosting |

## Getting started

Requirements: Node.js `^20.19`, `^22.12` or `>=24` and npm 10+. You also need the [API](https://github.com/gabrielmdss/entrega_certa_backend_v3) running.

```bash
npm install
npm start
```

Point the app to the API in `public/config.json`:

```json
{ "apiBaseUrl": "http://localhost:3101/api/v1" }
```

### Quality checks

```bash
npm run lint
npm run typecheck
npm test -- --watch=false
npm run build
```

### Production build

`npm run build:producao` writes `public/config.json` from the `API_BASE_URL` environment variable and builds the app. See [docs/deploy.md](docs/deploy.md).

## Author

**Gabriel Mendes**, Full Stack Developer · [Portfolio](https://gabriel-mendes-dev.vercel.app) · [LinkedIn](https://linkedin.com/in/gabrielmendesdeveloper)
