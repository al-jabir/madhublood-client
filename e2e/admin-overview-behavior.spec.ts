import { test, expect } from "@playwright/test";
for (const role of ["admin", "super-admin"])
  test(`${role} overview uses measured readiness, full totals and scoped queue pagination`, async ({
    page,
  }) => {
    await page.addInitScript(() =>
      localStorage.setItem(
        "madhublood-preferences",
        JSON.stringify({ state: { en: true, dark: true }, version: 0 }),
      ),
    );
    let queuePage = "";
    await page.route("**/api/ready", (route) =>
      route.fulfill({
        status: 503,
        json: { ready: false, database: "unavailable" },
      }),
    );
    await page.route("**/api/v1/**", (route) => {
      const url = new URL(route.request().url()),
        path = url.pathname;
      if (path.endsWith("/auth/me"))
        return route.fulfill({
          json: {
            csrf: "fixture",
            user: {
              id: "111111111111111111111111",
              name: "Staff",
              roles: [role],
              profileCompleted: true,
              emailVerified: true,
            },
          },
        });
      if (path.endsWith("/platform"))
        return route.fulfill({
          json: {
            maintenance: false,
            registrationOpen: true,
            supportMessage: "",
          },
        });
      if (path.endsWith("/admin/analytics"))
        return route.fulfill({
          json: { donors: 100, available: 60, active: 6, completed: 20 },
        });
      if (path.endsWith("/admin/queue")) {
        queuePage =
          url.searchParams.get("requestsAfter") ??
          url.searchParams.get("donorsAfter") ??
          "";
        return route.fulfill({
          json: {
            requests: [
              {
                _id: "222222222222222222222222",
                hospital: queuePage
                  ? "Next request hospital"
                  : "First request hospital",
                bloodGroup: "B+",
                area: "Madhupur, Tangail",
                status: "submitted",
              },
            ],
            donors: [
              {
                _id: "333333333333333333333333",
                displayName: queuePage ? "Next donor" : "First donor",
                area: "Madhupur, Tangail",
              },
            ],
            requestsTotal: 67,
            donorsTotal: 43,
            requestsNextCursor: queuePage ? null : "444444444444444444444444",
            donorsNextCursor: queuePage ? null : "555555555555555555555555",
          },
        });
      }
      return route.fulfill({ json: { items: [], total: 0 } });
    });
    await page.goto("/admin");
    const hub = page.locator(".admin-dashboard-hub");
    await expect(hub.getByText("Not ready", { exact: true })).toBeVisible();
    await expect(
      hub.getByText("Connected & ready", { exact: true }),
    ).toHaveCount(0);
    await expect(
      hub.locator('.admin-queue-card[href$="requests"] strong'),
    ).toHaveText("67");
    await expect(
      hub.locator('.admin-queue-card[href$="donors"] strong'),
    ).toHaveText("43");
    await expect(hub.locator('a[href="/admin?section=settings"]')).toHaveCount(
      role === "super-admin" ? 2 : 0,
    );
    await hub.locator('a[href="/admin?section=requests"]').first().click();
    await expect(
      page.getByRole("cell", { name: /First request hospital/ }),
    ).toBeVisible();
    await page
      .getByRole("navigation", { name: "List pagination" })
      .getByRole("button", { name: "Next", exact: true })
      .click();
    await expect(
      page.getByRole("cell", { name: /Next request hospital/ }),
    ).toBeVisible();
    expect(queuePage).toBe("444444444444444444444444");
    await page
      .getByRole("navigation", { name: "List pagination" })
      .getByRole("button", { name: "Previous", exact: true })
      .click();
    await expect(
      page.getByRole("cell", { name: /First request hospital/ }),
    ).toBeVisible();
    await page.goto("/admin?section=donors");
    await expect(page.getByText("First donor", { exact: true })).toBeVisible();
    await page
      .getByRole("navigation", { name: "List pagination" })
      .getByRole("button", { name: "Next", exact: true })
      .click();
    await expect(page.getByText("Next donor", { exact: true })).toBeVisible();
    expect(queuePage).toBe("555555555555555555555555");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
test("failed status and queue probes remain unknown and can be retried", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "madhublood-preferences",
      JSON.stringify({ state: { en: true, dark: false }, version: 0 }),
    ),
  );
  let failed = true;
  await page.route("**/api/ready", (route) =>
    failed
      ? route.fulfill({ status: 500, json: {} })
      : route.fulfill({ json: { ready: true, database: "connected" } }),
  );
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me"))
      return route.fulfill({
        json: {
          csrf: "fixture",
          user: {
            id: "111111111111111111111111",
            name: "Root",
            roles: ["super-admin"],
            profileCompleted: true,
            emailVerified: true,
          },
        },
      });
    if (path.endsWith("/admin/analytics"))
      return route.fulfill({
        json: { donors: 0, available: 0, active: 0, completed: 0 },
      });
    if (path.endsWith("/platform"))
      return failed
        ? route.fulfill({ status: 500, json: {} })
        : route.fulfill({
            json: { maintenance: false, registrationOpen: true },
          });
    if (path.endsWith("/admin/queue"))
      return failed
        ? route.fulfill({ status: 500, json: {} })
        : route.fulfill({
            json: {
              requests: [],
              donors: [],
              requestsTotal: 0,
              donorsTotal: 0,
            },
          });
    return route.fulfill({ json: { items: [] } });
  });
  await page.goto("/admin");
  const hub = page.locator(".admin-dashboard-hub");
  await expect(
    hub.getByText("Could not load queue", { exact: true }),
  ).toHaveCount(2);
  await expect(
    hub.getByText("Could not verify", { exact: true }),
  ).toBeVisible();
  await expect(
    hub.getByText("Status unavailable", { exact: true }),
  ).toHaveCount(2);
  await expect(hub.getByText("Connected & ready", { exact: true })).toHaveCount(
    0,
  );
  failed = false;
  await hub
    .getByRole("button", { name: "Retry status and queue checks" })
    .click();
  await expect(
    hub.getByText("Connected & ready", { exact: true }),
  ).toBeVisible();
  await expect(
    hub.getByText("No requests awaiting review", { exact: true }),
  ).toBeVisible();
});
