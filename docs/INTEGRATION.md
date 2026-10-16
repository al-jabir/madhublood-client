# Client integration and acceptance

## Connected flows

| Client | Server API under /api/v1 |
| --- | --- |
| /register | POST /auth/register; private recovery key shown once, then profile onboarding |
| /login | POST /auth/login followed by GET /auth/me to confirm the retained session |
| /verify-email | POST /auth/request-email-verification and /auth/verify-email |
| /forgot-password, /reset-password | POST /auth/forgot-password then /auth/reset-password-email, or /auth/reset-password with the saved recovery key |
| /dashboard?tab=profile | GET/PUT /account/profile, GET/PUT /donors/me, verified location selection |
| /donors | GET /donors with group, location and availability filters |
| /requests and request detail | GET /blood-requests, owner/donor actions through the existing feature API |
| /requests/new | Private drafts and POST /blood-requests; personal profile required by the API |
| Dashboard settings | Session revocation, password/recovery-key changes, account export/deletion |
| /admin | Existing role-gated moderation, coordination, settings, audit and operations |

The UI does not pretend an email was delivered when it was merely queued. Reset/verification forms handle invalid codes, show API errors and use a 60-second resend cooldown. The server enforces expiry, attempts, cooldowns and ownership independently. Sensitive reset code/password/recovery values stay in component/form memory, not URL parameters or persisted application storage. Only language/theme preferences are persisted. Password reset clears query/session state; verification refreshes the account status.

## Connection

Local `/api` uses Vite's proxy to localhost:5000. Production `/api` uses the external Vercel rewrite to the selected Render server. API routes appear before the SPA rewrite and have private/no-store caching. Axios uses credentials, an in-memory CSRF header and a 60-second timeout to accommodate an initial free-host cold start. Server checks still authorize every mutation; hiding UI controls is not authorization.

This is repository configuration, not confirmation of a deployed proxy. Publish the updated client and verify https://madhublood.vercel.app/api/ready returns JSON, not the SPA HTML. A stale VITE_API_URL override can bypass the proxy. On a different host, configure the corresponding reverse proxy.

## Verification scope

16 October 2026: source/test typechecks, lint, eight unit/architecture tests and production build passed. Final browser suite: 26 passed, zero failures; two live coordinator cases skipped because disposable account fixtures were not configured. Read-only checks returned HTTP 200 for locations through the local client proxy (35 items) and requests (zero active items). No real registration, password change, email delivery or production workflow mutation was performed.

Homepage integration now uses real donor/request responses without demo people, fabricated requests or invented donation counts. Empty/error/loading states are separate. Quick-request contact/hospital details travel in React Router navigation state rather than URL parameters, survive sign-in and can resume after profile onboarding. Continuation targets are restricted to known internal routes. These details are not saved in localStorage.

The decorative label class is now eyebrow-label, avoiding Tailwind's overline text-decoration utility. Auth/header and quick-request top decorations were removed; input borders and keyboard focus indicators remain. Desktop/mobile tests verify label decoration, viewport fit, empty API results and the sign-in continuation.

Run `npm run check` for typecheck/lint/unit tests/build. `npm run test:e2e` covers desktop/mobile account registration/profile, sign-in and recovery-key reset, email-code reset (including rejected codes), email verification/status refresh, private drafts, moderation settings, language persistence, responsive overflow and accessibility. Email/reset tests mock the API and do not send real email. Existing live coordinator tests require E2E_ACCOUNTS_FILE and are skipped without disposable account fixtures.

The public homepage reads real API locations and requests; it does not invent donors, requests, donation counts or successful deliveries. Empty and failure states reflect returned data.

## Hosted acceptance after publishing

Use an account you own: register and privately save the recovery key; verify the received email code; complete the profile and optional donor consent; reload to confirm the session; create a request and confirm moderation; sign out; recover the password by email; verify that the old password/session no longer works. Generate a new recovery key in settings after email reset. Do not create fake blood requests on the public service to test workflow; use an isolated staging environment for donation/moderation exercises.

The server's operational release gates (production email delivery, backup approval/restore, monitoring and data/clinical review) are separate from client implementation.
