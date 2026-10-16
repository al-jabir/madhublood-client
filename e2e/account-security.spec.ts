import { test, expect } from "@playwright/test";

test("registration carries the phone number into verification", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "madhublood-preferences",
      JSON.stringify({ state: { en: true, dark: false }, version: 0 }),
    ),
  );
  await page.route("**/api/v1/**", async (route) => {
    if (new URL(route.request().url()).pathname.endsWith("/auth/register")) {
      expect(route.request().postDataJSON()).toMatchObject({
        name: "New donor",
        phone: "+8801712345678",
        consent: true,
      });
      await route.fulfill({
        status: 202,
        json: {
          message:
            "If the number can be registered, a verification code will be sent.",
        },
      });
    } else
      await route.fulfill({
        status: 401,
        json: { error: { message: "Please sign in" } },
      });
  });
  await page.goto("/register");
  await page.getByLabel("Full name", { exact: true }).fill("New donor");
  await page
    .getByLabel("Mobile number", { exact: true })
    .fill("+8801712345678");
  await page
    .getByLabel("Password", { exact: true })
    .fill("new-secure-password");
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page).toHaveURL(/\/verify-otp$/);
  await expect(page.getByLabel("Mobile number", { exact: true })).toHaveValue(
    "+8801712345678",
  );
});

test("settings revokes sessions and changes passwords with validation", async ({
  page,
}) => {
  let signedIn = true;
  let passwordChanges = 0;
  let sessions = [
    {
      id: "111111111111111111111111",
      current: true,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    },
    {
      id: "222222222222222222222222",
      current: false,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    },
  ];
  // All API traffic is intercepted; this UI test never touches real accounts.
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me")) {
      await route.fulfill({
        status: signedIn ? 200 : 401,
        json: signedIn
          ? {
              user: {
                id: "test-user",
                name: "Security tester",
                phone: "+8801712345678",
                verified: true,
                roles: ["user"],
                notificationConsent: false,
              },
              csrf: "test-csrf",
            }
          : { error: { message: "Please sign in" } },
      });
    } else if (path.endsWith("/auth/sessions")) {
      await route.fulfill({ json: { items: sessions } });
    } else if (path.includes("/auth/sessions/")) {
      expect(route.request().method()).toBe("DELETE");
      expect(route.request().headers()["x-csrf-token"]).toBe("test-csrf");
      sessions = sessions.filter((session) => !path.endsWith(session.id));
      await route.fulfill({
        json: { ok: true, message: "Session signed out successfully." },
      });
    } else if (path.endsWith("/auth/change-password")) {
      expect(route.request().postDataJSON()).toEqual({
        currentPassword: "original-password",
        newPassword: "new-secure-password",
      });
      expect(route.request().headers()["x-csrf-token"]).toBe("test-csrf");
      passwordChanges++;
      signedIn = false;
      await route.fulfill({
        json: {
          ok: true,
          message: "Password changed successfully. Please sign in again.",
        },
      });
    } else await route.fulfill({ json: { items: [] } });
  });
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "settings", exact: true }).click();
  await expect(
    page.locator(".list-row").filter({ hasText: "Other session" }),
  ).toBeVisible();
  await page
    .locator(".list-row")
    .filter({ hasText: "Other session" })
    .getByRole("button", { name: "Sign out", exact: true })
    .click();
  await expect(
    page.locator(".list-row").filter({ hasText: "Other session" }),
  ).toHaveCount(0);
  await page
    .getByLabel("Current password", { exact: true })
    .fill("original-password");
  await page
    .getByLabel("New password (at least 12 characters)", { exact: true })
    .fill("new-secure-password");
  await page
    .getByLabel("Confirm new password", { exact: true })
    .fill("different-password");
  await page
    .getByRole("button", { name: "Change password", exact: true })
    .click();
  await expect(
    page.getByText("The new passwords do not match.", { exact: true }),
  ).toBeVisible();
  expect(passwordChanges).toBe(0);
  await page
    .getByLabel("Confirm new password", { exact: true })
    .fill("new-secure-password");
  await page
    .getByRole("button", { name: "Change password", exact: true })
    .click();
  await expect(page).toHaveURL(/\/login$/);
  expect(passwordChanges).toBe(1);
});
