import { test } from "node:test";
import assert from "node:assert/strict";
import {
  returnToFrom,
  authorizedReturnTo,
  personalLoginPath,
} from "../src/features/auth/return-to.ts";
test("sign-in continuation preserves an internal request and rejects external redirects", () => {
  const target = {
    pathname: "/requests/new",
    state: { prefill: { bloodGroup: "B+" } },
  };
  assert.deepEqual(returnToFrom({ returnTo: target }), target);
  for (const pathname of [
    "https://example.test",
    "//example.test",
    "/\\example.test",
    "/login",
    "/requests/new?contact=private",
  ]) {
    assert.equal(returnToFrom({ returnTo: { pathname } }), undefined);
  }
});

test("public sign-in defaults to personal dashboard and blocks forbidden continuations", () => {
  const member = { roles: ["user"], volunteerPermissions: [] };
  assert.equal(personalLoginPath(true), "/dashboard");
  assert.equal(personalLoginPath(false), "/dashboard?tab=profile");
  for (const pathname of [
    "/admin",
    "/requests/new",
    "/requests/111111111111111111111111/edit",
  ])
    assert.equal(
      authorizedReturnTo({ returnTo: { pathname } }, member),
      undefined,
    );
  assert.equal(
    authorizedReturnTo({ returnTo: { pathname: "/requests" } }, member)
      ?.pathname,
    "/requests",
  );
  assert.equal(
    authorizedReturnTo(
      { returnTo: { pathname: "/admin" } },
      { roles: ["volunteer"], volunteerPermissions: ["submit-referrals"] },
    ),
    undefined,
  );
  assert.equal(
    authorizedReturnTo(
      { returnTo: { pathname: "/admin" } },
      { roles: ["admin"] },
    )?.pathname,
    "/admin",
  );
});
