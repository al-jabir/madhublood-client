# Frontend architecture

The existing UI was extracted rather than redesigned. `main.tsx` mounts `AppProviders` and `App`. Providers own the query client and error boundary; App owns the browser router; `app/router/AppRouter.tsx` defines lazy page imports and keeps every existing URL. `RootLayout` owns shared navigation/footer and a Suspense-wrapped outlet.

Features own their own HTTP clients, schemas and UI. Donor/request/profile queries retain their existing query keys, mutation invalidation and consent semantics. Feature pages never construct raw HTTP requests. `services/http.ts` is the only Axios instance and preserves credentials, timeout and CSRF headers. API DTOs belong to this client, with no shared root package or imports from backend source.

Shared components live under ui/common/feedback. Preferences remain persisted under the original storage key, and language/theme changes synchronize with the document through a reusable hook. Existing translations, content, CSS, local fonts, PWA manifest and offline fallback are preserved. Admin operations are composed from separate analytics, case, location, audit and role/user components. Charts and route pages load lazily.

Source imports use `@/` consistently. TypeScript covers app source and tests with separate configurations. Oxlint rejects explicit any. Architecture tests check local tool resolution, absence of server-source imports, page/API boundaries and runtime import cycles.

No empty asset/hooks/schema folders are generated to fill a template. Public static assets remain in `public/`; new asset directories should be introduced only when needed. Remaining incomplete localization and product requirements are inherited from the original implementation, not represented as completed by this refactor.
