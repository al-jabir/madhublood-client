# MadhuBlood launch acceptance — 17 October 2026

**Decision: live routing, hosted sessions, real backup/restore and hosted-only email delivery passed.** Client 211dfd8 and server 049c0a1 were pushed. Vercel reported successful deployment of the client revision.

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

## Hosted acceptance update

The initial deep-link probes found HTTP 404 on /login, /register, /verify-email, /forgot-password, /dashboard, /admin, /requests, /requests/new and /donors. After the client push and Vercel deployment, all ten client route probes and both proxied API probes returned HTTP 200. The SPA routing blocker is resolved.

Hosted admin login, session persistence across reload, logout and post-logout /admin protection passed in the in-app browser. The account password was not changed.

The owner confirmed receipt of a password-reset test email. A local development API sharing the Atlas queue was running, so a second hosted-only test was performed with local background jobs disabled. That new job retried; a private dashboard comparison then identified a mismatched GOOGLE_MAIL_SECRET. The owner corrected it and redeployed. A fresh hosted-only test at 14:37 Asia/Dhaka reached delivered with attempts=0, while the local API had background jobs disabled and no separate local worker ran. The original local jobs configuration was restored afterward. The hosting transport issue is resolved.

The approved real Atlas export was encrypted and restored in a disposable localhost database: 21 collections and 120 documents. The encrypted archive and SHA-256 metadata remain in ignored server/.backups; temporary restored data and URI file were removed. No point-in-time consistency, off-site copy or independent key custody is claimed.

## Final acceptance steps

1. Deployment routing, existing admin login/reload/logout and hosted-only reset delivery have passed. Preserve these as release checks.
2. Finish new-account registration/verification and code-consumption acceptance on the hosted environment with an explicitly approved test identity. No existing password was changed by the delivery checks.
3. Keep the encryption key separately and configure encrypted off-site retention/scheduling. The real local restore drill passed, but off-site recovery is not yet configured.
4. Confirm operational ownership, admin credential strength/ownership, moderation/privacy procedure and independent uptime/error/worker alerting. The local Codex heartbeat depends on the desktop app.

Do not advertise full production readiness until the remaining onboarding and operational gates pass. Backend details: server/docs/READINESS.md and server/docs/PRODUCTION.md in the sibling checkout.
