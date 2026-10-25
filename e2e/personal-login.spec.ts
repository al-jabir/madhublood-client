import { test, expect } from "@playwright/test";
for (const role of ["user", "volunteer", "admin"])
  test(`public login opens personal dashboard for ${role}`, async ({
    page,
  }, info) => {
    await page.addInitScript(() =>
      localStorage.setItem(
        "madhublood-preferences",
        JSON.stringify({ state: { en: true, dark: true }, version: 0 }),
      ),
    );
    let signedIn = false;
    const user = {
      id: "111111111111111111111111",
      name: "Example member",
      email: "member@example.test",
      roles: [role],
      volunteerPermissions: role === "volunteer" ? ["submit-referrals"] : [],
      profileCompleted: true,
      emailVerified: true,
      phone: "01712345678",
      area: "Madhupur, Tangail",
    };
    await page.route("**/api/v1/**", (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/auth/login")) {
        signedIn = true;
        return route.fulfill({ json: { ok: true } });
      }
      if (path.endsWith("/auth/me"))
        return route.fulfill({
          status: signedIn ? 200 : 401,
          json: signedIn ? { user, csrf: "fixture" } : {},
        });
      if (path.endsWith("/platform"))
        return route.fulfill({
          json: { maintenance: false, registrationOpen: true },
        });
      if (path.endsWith("/donors/me"))
        return route.fulfill({
          status: 404,
          json: { error: { message: "Donor profile not found" } },
        });
      return route.fulfill({ json: { items: [], total: 0 } });
    });
    await page.goto("/login");
    await page.getByLabel("Email address", { exact: true }).fill(user.email);
    await page.getByLabel("Password", { exact: true }).fill("secure-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", { name: "Welcome, Example member" }),
    ).toBeVisible();
    await expect(page.locator(".admin-shell")).toHaveCount(0);
    if (role === "user")
      await expect(
        page.getByRole("link", { name: "Moderation", exact: true }),
      ).toHaveCount(0);
    for (const tab of [
      "Profile",
      "Donor form",
      "Donation history",
      "Notifications",
      "Settings",
    ]) {
      await page
        .locator(".dashboard-tabs")
        .getByRole("button", { name: tab, exact: true })
        .click();
      await expect(page.locator(".dashboard-tabs button.selected")).toHaveText(
        tab,
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await page.screenshot({
      path: `.runtime/personal-dashboard-${role}-${info.project.name}.png`,
      fullPage: true,
    });
  });
