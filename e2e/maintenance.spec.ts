import { test, expect } from "@playwright/test";

test("maintenance blocks public deep links and restores the same route", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "madhublood-prefs",
      JSON.stringify({ state: { en: true, dark: true }, version: 0 }),
    ),
  );
  let maintenance = true;
  let liveCalls = 0;
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/platform"))
      return route.fulfill({
        json: {
          maintenance,
          registrationOpen: true,
          supportMessage: "Scheduled update",
        },
      });
    if (path.endsWith("/auth/me"))
      return route.fulfill({ status: 401, json: {} });
    liveCalls++;
    return route.fulfill({ json: { items: [], total: 0 } });
  });
  for (const path of ["/", "/donors", "/requests", "/register", "/volunteer"]) {
    await page.goto(path);
    await expect(page.locator(".maintenance-title")).toBeVisible();
    await expect(
      page.getByText("Scheduled update", { exact: true }),
    ).toBeVisible();
    expect(liveCalls).toBe(0);
  }
  await page.goto("/donors");
  maintenance = false;
  await page.locator(".maintenance-actions button").click();
  await expect(page.locator(".maintenance-title")).toHaveCount(0);
  await expect(page).toHaveURL(/\/donors$/);
  await expect.poll(() => liveCalls).toBeGreaterThan(0);
});

test("maintenance keeps administrator sign-in accessible", async ({ page }) => {
  await page.route("**/api/v1/**", (route) =>
    new URL(route.request().url()).pathname.endsWith("/auth/me")
      ? route.fulfill({ status: 401, json: {} })
      : route.fulfill({ json: { maintenance: true, registrationOpen: false } }),
  );
  await page.goto("/admin/login");
  await expect(
    page.getByRole("heading", { name: /Admin Portal|অ্যাডমিন পোর্টাল/ }),
  ).toBeVisible();
  await expect(page.locator(".maintenance-title")).toHaveCount(0);
});
