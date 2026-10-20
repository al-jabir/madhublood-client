import { test, expect } from "@playwright/test";

test.describe("Dedicated Admin Login & Dashboard Management", () => {
  test("unauthenticated visitor to /admin redirects to /admin/login", async ({
    page,
  }) => {
    await page.route("**/api/v1/**", (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/auth/me")) {
        return route.fulfill({ status: 401, json: {} });
      }
      return route.fulfill({ json: { items: [], total: 0 } });
    });

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 15000 });
    await expect(
      page.getByRole("heading", { name: /Admin Portal|অ্যাডমিন পোর্টাল/ }),
    ).toBeVisible();
    await expect(page.getByLabel(/Administrator Email|অ্যাডমিন ইমেইল/)).toBeVisible();
  });

  test("admin login page renders dedicated console UI and language toggle", async ({
    page,
  }) => {
    await page.route("**/api/v1/**", (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/auth/me")) {
        return route.fulfill({ status: 401, json: {} });
      }
      return route.fulfill({ json: {} });
    });

    await page.goto("/admin/login");
    await expect(
      page.getByRole("heading", { name: "অ্যাডমিন পোর্টাল লগইন" }),
    ).toBeVisible();

    // Toggle to English
    await page.getByRole("button", { name: "Change language" }).click();
    await expect(
      page.getByRole("heading", { name: "Sign In to Admin Portal" }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Administrator Email"),
    ).toBeVisible();

    // Has links to public member login and home
    await expect(
      page.getByRole("link", { name: "Public Member Sign In" }),
    ).toHaveAttribute("href", "/login");
    await expect(
      page.getByRole("link", { name: "Back to Home" }),
    ).toHaveAttribute("href", "/");
  });

  test("admin dashboard hub shows platform status and management actions", async ({
    page,
  }) => {
    await page.route("**/api/v1/**", (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/auth/me")) {
        return route.fulfill({
          json: {
            csrf: "test-csrf",
            user: {
              id: "adm123",
              name: "Super Administrator",
              roles: ["user", "admin", "super-admin"],
              emailVerified: true,
              profileCompleted: true,
            },
          },
        });
      }
      if (path.endsWith("/platform")) {
        return route.fulfill({
          json: {
            maintenance: false,
            registrationOpen: true,
            supportMessage: "",
          },
        });
      }
      if (path.endsWith("/admin/queue")) {
        return route.fulfill({
          json: {
            requests: [{ _id: "req1", status: "submitted" }],
            donors: [{ _id: "don1", verified: false }],
          },
        });
      }
      if (path.endsWith("/admin/analytics")) {
        return route.fulfill({
          json: {
            donors: 15,
            available: 8,
            active: 3,
            completed: 12,
          },
        });
      }
      return route.fulfill({ json: { items: [], total: 0 } });
    });

    await page.goto("/admin");
    await expect(page.locator(".admin-platform-status-bar")).toBeVisible();
    await expect(page.locator(".admin-queue-summary-grid")).toBeVisible();
    await expect(page.locator(".admin-management-actions-section")).toBeVisible();
    await expect(page.locator(".admin-queue-card.has-pending")).toHaveCount(2);
  });
});
