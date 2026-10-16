import { test } from "node:test";
import assert from "node:assert/strict";
import { returnToFrom } from "../src/features/auth/return-to.ts";
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
