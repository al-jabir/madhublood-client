> Current authentication: email/password with no MFA or SMS. Registration shows a one-time recovery key and opens the personal profile after saving it; sign-in opens the profile tab. Personal information (name, general location, optional contact phone/gender) is separate from optional donor blood group, donation history, availability and consent. Email is not claimed verified. Password reset uses the saved recovery key; no paid provider is required. Existing phone-only accounts need the server email migration before deployment.

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

## Production domains

Frontend: https://madhublood.vercel.app. Backend: https://madhublood-server.onrender.com.

The production source defaults to `https://madhublood-server.onrender.com/api/v1`, so no Vercel environment variable is needed. An optional VITE_API_URL override is read at build time. Use the client directory as the project root, `npm run build` and output `dist`. For local production builds, copy `.env.production.example` to `.env.production` on a fresh checkout. Keep the local development value `/api/v1` to use Vite's proxy. The browser-facing variable is public and must never contain database/provider secrets.

The Render server must allow exactly `CLIENT_ORIGIN=https://madhublood.vercel.app`, with production cookie settings. These are different sites: production sessions use Secure/HttpOnly/SameSite=None and Axios sends credentials. Browsers that block third-party cookies may still prevent persistent login; verify the target browsers or use same-site custom domains before public release. Configure SPA route fallback in the hosting project and test refreshing a nested page. Hosting dashboard changes are separate from local file changes.

## Production without Vercel environment variables

No Vercel environment variable is required for the current public API address. Production builds default to `https://madhublood-server.onrender.com/api/v1`; development defaults to `/api/v1` through Vite's local proxy. `VITE_API_URL` is an optional override. A nonblank override takes precedence, so remove an old incorrect value if one exists. Only the public API URL is in the browser bundle; server credentials remain private.

Commit/push this source change and redeploy the Vercel project to publish it. Render also needs the updated server revision: when CLIENT_ORIGIN is unset, production allows `https://madhublood.vercel.app` by default. If an old CLIENT_ORIGIN is already set on Render, correct it or remove it to use that default. CORS/Origin/CSRF and credentialed-cookie protections remain enabled.
