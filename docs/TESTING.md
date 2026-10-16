# Frontend and full-stack browser tests

Run `npm test` for independent client unit/architecture checks; no backend is required. Run `npm run typecheck`, `npm run lint` and `npm run build` independently from client/.

Browser tests use installed Edge by default. Override `PLAYWRIGHT_BROWSER=chrome` for installed Chrome, or install a supported Playwright Chromium and set `PLAYWRIGHT_BROWSER=chromium`. The browser suite starts/reuses only the client Vite server; the backend must be started separately. No backend code is imported by browser tests.

## Full workflow setup

1. Start a dedicated MongoDB test instance. Never use production data.
2. In a **server/** terminal:

```powershell
$env:MONGODB_URI='mongodb://127.0.0.1:27019/madhublood_e2e'
$env:E2E_MONGODB_URI=$env:MONGODB_URI
npm run fixtures:create
npm run dev
```

3. In a **client/** terminal:

```powershell
$env:E2E_ACCOUNTS_FILE=(Resolve-Path '../server/.runtime/e2e-accounts.json').Path
npm run test:e2e
```

4. After browser testing, run `npm run fixtures:clean` in a server terminal with the same dedicated database configuration. It removes only the provisioned users and their owned test records after verifying the generated credentials.

The fixture file is a private, ignored testing contract containing temporary credentials, not a runtime dependency between applications. The complete workflow test is explicitly skipped when `E2E_ACCOUNTS_FILE` is absent. The other browser tests cover language, filtering, form validation, route recovery and axe accessibility scans. `E2E_BASE_URL` changes the client URL. Tests use desktop and mobile viewports and save local screenshots/traces under client/.runtime and client/test-results.

The workflow test signs in separate requester, donor and moderator browser contexts, edits donor consent, submits a request, moderates it, accepts it, verifies protected contacts and completes it. Passing axe scans are scoped checks, not a WCAG conformance certificate. Product limitations remain in the server readiness report.
