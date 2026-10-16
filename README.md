> Email/password registration and sign-in, email verification, email-code password reset and a saved one-use recovery key are connected to the backend. Registration shows the private key once, then opens profile onboarding. Donor/contact details remain optional and consent-based. No SMS or MFA is used.

# MadhuBlood client

An independent React 19 / Vite / TypeScript application. It uses Tailwind CSS v4, React Router, TanStack Query, Zustand, React Hook Form, Zod, Axios and accessible shared controls. There is no root package manager or workspace.

## Local development

Requires Node.js 24 or later and npm. Run commands **inside client/**:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Open http://127.0.0.1:5173. Start the API separately using the server README. The Vite development proxy forwards `/api` to http://127.0.0.1:5000, matching the server's configured port. Set `API_PROXY_TARGET` in the client's environment if you intentionally change the API port. This setting is used by Vite only and is not exposed in browser code. The client never reads server/.env or its MongoDB credentials. Leave `VITE_API_URL=/api/v1` for local proxy use. An absolute API origin needs the matching backend CORS allowlist and cookie configuration.

## Commands

| Command | Purpose |
|---|---|
| `npm ci` | Reproduce this application's own lockfile |
| `npm run typecheck` | Strict TypeScript checks for source, tests and tooling |
| `npm run lint` | Oxlint; warnings and explicit any are errors |
| `npm test` | Unit tests and architectural boundary/cycle checks |
| `npm run build` | Typecheck source and create `dist/` |
| `npm run preview` | Serve the built client; configure a real API URL/proxy separately |
| `npm run test:e2e` | Desktop/mobile browser regression and accessibility checks |
| `npm run check` | Typecheck, lint, unit tests and production build |

## Structure

```text
src/
  app/              # App, provider composition and lazy route configuration
  components/       # Shared ui, common and feedback components
  features/         # auth, donors, blood-requests, donations, notifications,
                    # profile, locations, admin, super-admin, home, information
  hooks/            # Document language/theme synchronization
  layouts/          # Shared navigation, footer and route outlet
  lib/              # TanStack Query client
  services/         # Axios transport and CSRF header handling
  store/            # Persisted UI preferences
  styles/           # Existing visual identity and responsive styles
  types/            # Frontend-owned API DTOs
  utils/            # Safe error formatting
  i18n/             # Existing translated content and language helper
  main.tsx          # Application bootstrap only
```

Feature folders contain only the API clients, components, hooks, pages and schemas they actually use. `@/` maps to `src/` in both TypeScript and Vite. See [architecture](docs/ARCHITECTURE.md) and [browser testing](docs/TESTING.md).

The refactor preserves current product functionality. It does not resolve all existing launch requirements; see the server's readiness report for the remaining clinical, privacy, provider and product limitations.

## Production connection

Frontend: https://madhublood.vercel.app. Backend: https://madhublood-server.onrender.com.

The browser defaults to `/api/v1`. The checked-in `vercel.json` forwards `/api/:path*` to the Render API before the SPA fallback. This keeps browser session cookies on the frontend origin and avoids depending on cross-site cookie acceptance. API responses are marked private/no-store. Server Origin/CSRF protection remains enabled. No Vercel environment variable is required.

If a previous Vercel VITE_API_URL points directly at Render, remove it or change it to `/api/v1`, then redeploy. Explicit overrides take precedence over the source default. On hosts other than Vercel, configure an equivalent API reverse proxy or a reviewed VITE_API_URL override. Vite preview alone does not provide this hosting rewrite.

Vercel build: `npm ci --include=dev && npm run build`, output `dist`, repository root containing this package.json. Deploy the updated vercel.json with the client. Keep production server CLIENT_ORIGIN set to the exact frontend origin. Verify browser login, refresh, logout and actual inbox delivery after deployment; local mocked tests do not certify hosted cookies or mail.

See [integration notes](docs/INTEGRATION.md) for routes, tests and acceptance steps.
