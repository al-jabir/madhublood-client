import { test, expect } from "@playwright/test";
for (const maintenance of [false, true])
  test(`administrator can switch between full public site and console (maintenance=${maintenance})`, async ({
    page,
  }, info) => {
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
            csrf: "fixture",
            user: {
              id: "111111111111111111111111",
              name: "Administrator with a long name",
              roles: ["super-admin"],
              emailVerified: true,
              profileCompleted: true,
              volunteerPermissions: [],
            },
          },
        });
      if (path.endsWith("/platform"))
        return route.fulfill({
          json: { maintenance, registrationOpen: true, supportMessage: "" },
        });
      if (path.endsWith("/admin/queue"))
        return route.fulfill({
          json: { requests: [], donors: [], requestsTotal: 0, donorsTotal: 0 },
        });
      if (path.endsWith("/admin/analytics"))
        return route.fulfill({
          json: { donors: 0, available: 0, active: 0, completed: 0 },
        });
      if (path.endsWith("/community-stats"))
        return route.fulfill({
          json: {
            activeRequests: 0,
            availableDonors: 0,
            members: 0,
            donations: 0,
          },
        });
      return route.fulfill({ json: { items: [], total: 0 } });
    });
    await page.goto("/admin");
    await page
      .getByRole("link", { name: "Open public site", exact: true })
      .click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator(".site-header .brand")).toBeVisible();
    await expect(page.locator(".maintenance-title")).toHaveCount(0);
    const trigger = page.locator(".site-header .account-trigger");
    await trigger.click();
    await expect(
      page.getByRole("link", { name: "Admin dashboard", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "My dashboard", exact: true }),
    ).toBeVisible();
    const box = await page.locator(".account-dropdown").boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    await page.screenshot({
      path: `.runtime/admin-public-header-${maintenance}-${info.project.name}.png`,
    });
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await expect(page.locator(".account-dropdown")).toHaveCount(0);
    await trigger.click();
    await page
      .getByRole("link", { name: "Admin dashboard", exact: true })
      .click();
    await expect(page).toHaveURL(/\/admin$/);
    await page.locator(".account-trigger").click();
    await page
      .locator(".account-dropdown")
      .getByRole("link", { name: "View website", exact: true })
      .click();
    await expect(page.locator(".site-header")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
