# MadhuBlood launch acceptance — 17 October 2026

**Decision: local release candidate prepared; public launch acceptance pending.** Latest source changes are not committed, pushed or deployed by this audit. The currently deployed frontend has broken direct page URLs.

## Local fixes in this audit

- Fixed the conflicting Vercel cleanUrls + index.html SPA fallback configuration. Kept the API rewrite before the SPA fallback and API no-store caching. Vercel documentation: https://vercel.com/docs/frameworks/frontend/vite
- Added a config regression test and `npm run deployment:verify` for public route and same-origin API acceptance. The latter intentionally exits nonzero while any deployed route remains broken.
- Extracted demo and community-stat network calls into feature API modules; the existing architecture test now passes.
- Localized public error routes and updated browser tests for the mobile language control, custom request date/time picker, current admin table and donor profile flow.
- Prepared a real browser workflow runner in the sibling server (`npm run test:browser`) using a disposable localhost replica set, API, frontend and fictional accounts. It does not load application .env, touch Atlas data, or send mail. Application runtime still uses Atlas only.

## Evidence

- Client architecture/forms/utility/config suite: 9 tests pass. Client typecheck/lint/build acceptance is checked by `npm run check`.
- Mocked UI regression: 60 scenarios across desktop/mobile passed across the primary run plus the corrected mobile dashboard selector rerun (59 passed initially, one stale selector failed and was corrected).
- Public navigation and WCAG accessibility: 6 scenarios pass, desktop/mobile, with deterministic public API responses.
- Real API browser coordination: 2 scenarios pass, desktop/mobile. Separate fictional requester, moderator and donor accounts log in, save donor consent, create a request, review/activate it, respond, see permitted contact details, and mark it arranged/completed. Outbound email is disabled; no real inbox delivery is claimed.
- Server: all 43 backend tests pass with zero skips using an isolated test database. Typecheck, lint and build pass.
- Client and server production dependency audits: zero known vulnerabilities at audit time.
- Public backend: root, ready, OpenAPI and credentialed client-origin preflight pass.
- Atlas (read-only): ping/topology/email identity indexes pass; active queue has zero failed/overdue jobs.
- Google bridge: authentication and quota pass; no email sent.

## Current hosted blocker

Read-only HTTPS probes found HTTP 404 for /login, /register, /verify-email, /forgot-password, /dashboard, /admin, /requests, /requests/new and /donors. Homepage, proxied /api/ready (ready=true, database=connected), and /api/v1/platform (maintenance=false, registrationOpen=true) return HTTP 200.

The local Vercel configuration fix must be reviewed and deployed, then the public probe rerun. Local Vite tests cannot prove Vercel routing is repaired on the hosting platform.

## Final acceptance steps

1. Review and publish the intended client/server changes. Record exact deployed revisions and keep a rollback revision. Do not commit .env, test artifacts, account files or backups.
2. After deployment, run `npm run deployment:verify` from client and server. All routes and API probes must pass.
3. With an explicitly approved recipient, verify actual register/verify/login/logout/password-reset delivery and cookies on the hosted website. Do not send messages or create real accounts without that authorization.
4. With explicit approval for copying production personal/authentication data, run the documented encrypted Atlas backup and isolated restore drill. Previous synthetic backup results do not satisfy this step. No actual production backup was made during this audit.
5. Confirm operational ownership, credential strength/ownership, backup retention, moderation/privacy procedure and independent uptime/error/worker alerting. The local Codex heartbeat depends on the desktop app.

Do not advertise full production readiness until these hosted and operational gates pass. Backend details: server/docs/READINESS.md and server/docs/PRODUCTION.md in the sibling checkout.
