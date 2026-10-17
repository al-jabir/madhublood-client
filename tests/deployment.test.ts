import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Vercel keeps API rewrites before a valid SPA deep-link fallback", () => {
  const config = JSON.parse(
    fs.readFileSync(new URL("../vercel.json", import.meta.url), "utf8"),
  );
  const [api, spa] = config.rewrites;
  assert.equal(api.source, "/api/:path*");
  assert.equal(
    api.destination,
    "https://madhublood-server.onrender.com/api/:path*",
  );
  assert.equal(spa.source, "/(.*)");
  assert.equal(spa.destination, "/index.html");
  assert.notEqual(
    config.cleanUrls,
    true,
    "cleanUrls requires an extensionless rewrite destination",
  );
  assert.equal(config.headers[0].headers[0].value, "private, no-store");
});
