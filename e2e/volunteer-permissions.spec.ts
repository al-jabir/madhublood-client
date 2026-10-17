import { test, expect } from "@playwright/test";
for (const permission of ["none", "submit-referrals", "coordinate-requests"])
  test(`volunteer work controls follow ${permission} permission`, async ({
    page,
  }) => {
    let boardCalls = 0;
    await page.addInitScript(() =>
      localStorage.setItem(
        "madhublood-preferences",
        JSON.stringify({ state: { en: true, dark: true }, version: 0 }),
      ),
    );
    await page.route("**/api/v1/**", (route) => {
      const p = new URL(route.request().url()).pathname;
      if (p.endsWith("/auth/me"))
        return route.fulfill({
          json: {
            csrf: "fixture",
            user: {
              id: "111111111111111111111111",
              name: "Volunteer",
              roles: ["user", "volunteer"],
              volunteerPermissions: permission === "none" ? [] : [permission],
              profileCompleted: true,
              emailVerified: true,
            },
          },
        });
      if (p.endsWith("/admin/volunteer-dashboard")) {
        boardCalls++;
        return route.fulfill({
          json: {
            stats: {
              created: 0,
              pending: 0,
              open: 0,
              completed: 0,
              assignedOpen: 0,
              callbacks: 0,
              requestedUnits: 0,
              familyReportedUnits: 0,
            },
            items: [],
            total: 0,
            page: 1,
            canSubmit: permission === "submit-referrals",
            canManage: permission === "coordinate-requests",
          },
        });
      }
      return route.fulfill({
        json: { items: [], total: 0, page: 1, canAssign: false },
      });
    });
    await page.goto("/admin?section=coordination");
    await expect(
      page.getByRole("heading", { name: "Volunteer dashboard", exact: true }),
    ).toBeVisible();
    if (permission === "none") {
      await expect(
        page.getByRole("heading", { name: "Work permission required" }),
      ).toBeVisible();
      expect(boardCalls).toBe(0);
    } else {
      await expect(
        page.getByRole("button", { name: "Overview", exact: true }),
      ).toBeVisible();
      expect(boardCalls).toBeGreaterThan(0);
    }
    await expect(
      page.getByRole("link", { name: "Add a blood request", exact: true }),
    ).toHaveCount(permission === "submit-referrals" ? 1 : 0);
    await page.goto("/");
    await expect(page.locator("#quick-contact")).toHaveCount(
      permission === "submit-referrals" ? 1 : 0,
    );
    await page.getByRole("button", { name: "Volunteer", exact: true }).click();
    await expect(
      page
        .locator(".account-dropdown")
        .getByRole("link", { name: "Create blood request", exact: true }),
    ).toHaveCount(permission === "submit-referrals" ? 1 : 0);
    await page.goto("/requests");
    await expect(
      page.getByRole("link", { name: "Create a request", exact: true }),
    ).toHaveCount(permission === "submit-referrals" ? 1 : 0);
    await page.goto("/requests/new");
    await expect(
      page.getByRole("heading", {
        name:
          permission === "submit-referrals"
            ? "Create a blood request"
            : "Request submission is restricted",
      }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Submit on behalf of someone else"),
    ).toHaveCount(permission === "submit-referrals" ? 1 : 0);
  });
