import { test, expect } from "@playwright/test";
for (const width of [320, 390, 768, 1024, 1440]) {
  test(`header fits and navigation works at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    let signedIn = false;
    await page.addInitScript(() =>
      localStorage.setItem(
        "madhublood-preferences",
        JSON.stringify({ state: { en: true, dark: false }, version: 0 }),
      ),
    );
    await page.route("**/api/v1/**", (route) => {
      if (new URL(route.request().url()).pathname.endsWith("/auth/me"))
        return signedIn
          ? route.fulfill({
              json: {
                csrf: "test",
                user: {
                  id: "111111111111111111111111",
                  name: "A very long example donor name",
                  roles: ["user"],
                  profileCompleted: true,
                  emailVerified: true,
                },
              },
            })
          : route.fulfill({ status: 401, json: {} });
      return route.fulfill({ json: { items: [], total: 0 } });
    });
    for (const loggedIn of [false, true]) {
      signedIn = loggedIn;
      await page.goto("/login");
      await page.reload();
      if (loggedIn)
        await expect(page.locator(".account-trigger")).toBeVisible();
      else await expect(page.locator(".header-signin")).toBeVisible();
      const clean = await page.locator(".site-header").evaluate((header) => {
        const controls = Array.from(
          header.querySelector(".header-actions")!.children,
        ).map((item) => item.getBoundingClientRect());
        return controls.every(
          (r, i) =>
            r.left >= 0 &&
            r.right <= innerWidth &&
            (!i || r.left >= controls[i - 1].right - 1),
        );
      });
      expect(clean).toBe(true);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (width < 1200) {
        const toggle = page.getByRole("button", { name: "Toggle navigation" });
        await toggle.click();
        await expect(
          page.getByRole("navigation", { name: "Main navigation" }),
        ).toBeVisible();
        await page
          .getByRole("navigation", { name: "Main navigation" })
          .getByRole("link", { name: "Find donors", exact: true })
          .click();
        await expect(toggle).toHaveAttribute("aria-expanded", "false");
      }
    }
  });
}
