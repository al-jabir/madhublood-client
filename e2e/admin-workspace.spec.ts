import { test, expect } from "@playwright/test";
test("admin has a separate workspace and role-aware sidebar", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "madhublood-preferences",
      JSON.stringify({ state: { en: true, dark: true }, version: 0 }),
    ),
  );
  await page.route("**/api/ready", (route) =>
    route.fulfill({ json: { ready: true, database: "connected" } }),
  );
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me"))
      return route.fulfill({
        json: {
          csrf: "test",
          user: {
            id: "111111111111111111111111",
            name: "Test admin",
            roles: ["super-admin"],
            profileCompleted: true,
            emailVerified: true,
          },
        },
      });
    if (path.endsWith("/admin/analytics"))
      return route.fulfill({ json: { users: 12, donors: 8, requests: 4 } });
    if (path.endsWith("/admin/queue"))
      return route.fulfill({
        json: {
          requests: [
            {
              _id: "222222222222222222222222",
              bloodGroup: "A+",
              hospital: "Test hospital",
              area: "Test area",
              status: "submitted",
            },
          ],
          donors: [],
        },
      });
    return route.fulfill({ json: { items: [], total: 0 } });
  });
  await page.goto("/admin");
  await expect(page.locator(".admin-role")).toHaveText("Super admin");
  await expect(page.locator("header, footer, .topline")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Overview", exact: true }),
  ).toBeVisible();
  if (test.info().project.name === "mobile")
    await page.getByRole("button", { name: "Toggle admin navigation" }).click();
  await page
    .getByRole("navigation", { name: "Admin navigation" })
    .getByRole("link", { name: "Blood requests", exact: true })
    .click();
  await expect(page.getByRole("cell", { name: /Test hospital/ })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start review", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `.runtime/admin-workspace-${test.info().project.name}.png`,
    fullPage: true,
  });
});
