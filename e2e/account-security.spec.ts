import { test, expect } from "@playwright/test";
const id = "111111111111111111111111",
  locationId = "222222222222222222222222";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "madhublood-preferences",
      JSON.stringify({ state: { en: true, dark: false }, version: 0 }),
    ),
  );
});

test("email registration requires verification before the personal profile", async ({
  page,
}) => {
  let signedIn = false;
  let user = {
    id,
    email: "new@example.test",
    name: "",
    phone: "",
    roles: ["user"],
    profileCompleted: false,
    emailVerified: false,
    verificationRequired: true,
    notificationConsent: false,
  };
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/register")) {
      expect(route.request().postDataJSON()).toEqual({
        email: "new@example.test",
        password: "new-secure-password",
        consent: true,
      });
      signedIn = true;
      return route.fulfill({
        status: 201,
        json: {
          user,
          csrf: "fixture-csrf",
          message: "Account created",
        },
      });
    }
    if (path.endsWith("/auth/verify-email")) {
      expect(route.request().postDataJSON()).toEqual({
        email: "new@example.test",
        code: "123456",
      });
      user = { ...user, emailVerified: true, verificationRequired: false };
      return route.fulfill({ json: { message: "Email verified" } });
    }
    if (path.endsWith("/auth/me"))
      return route.fulfill({
        status: signedIn ? 200 : 401,
        json: signedIn
          ? { user, csrf: "fixture-csrf" }
          : { error: { message: "Please sign in" } },
      });
    if (path.endsWith("/platform"))
      return route.fulfill({
        json: {
          maintenance: false,
          registrationOpen: true,
          supportMessage: "",
        },
      });
    if (path.endsWith("/locations"))
      return route.fulfill({
        json: { items: [{ _id: locationId, name: "মধুপুর", kind: "upazila" }] },
      });
    if (path.endsWith("/account/profile")) {
      expect(route.request().headers()["x-csrf-token"]).toBe("fixture-csrf");
      expect(route.request().postDataJSON()).toEqual({
        name: "New donor",
        phone: "",
        gender: "undisclosed",
        locationId,
      });
      user = { ...user, name: "New donor", profileCompleted: true };
      return route.fulfill({
        json: { ...user, locationId, area: "মধুপুর, টাঙ্গাইল" },
      });
    }
    if (path.endsWith("/donors/me")) return route.fulfill({ json: null });
    return route.fulfill({ json: { items: [] } });
  });
  await page.goto("/register");
  await expect(page.getByLabel("Mobile number", { exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByLabel(/MFA/)).toHaveCount(0);
  await page
    .getByLabel("Email address", { exact: true })
    .fill("new@example.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill("new-secure-password");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("new-secure-password");
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByLabel("Account recovery key")).toHaveCount(0);
  await expect(page).toHaveURL(/verify-email/);
  await page.goto("/dashboard?tab=profile");
  await expect(page).toHaveURL(/verify-email/);
  await page.getByLabel("Verification code", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "Verify email", exact: true }).click();
  await expect(page).toHaveURL(/dashboard\?tab=profile/);
  await page.getByLabel("Full name", { exact: true }).fill("New donor");
  await page
    .getByRole("button", { name: "Save personal profile", exact: true })
    .click();
  await expect(page.locator(".profile-overview")).toContainText("New donor");
  await page.getByRole("button", { name: "Edit profile", exact: true }).click();
  await expect(
    page.getByLabel("Email address", { exact: true }),
  ).toHaveAttribute("readonly", "");
});

test("password recovery uses only an email code", async ({ page }) => {
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me"))
      return route.fulfill({ status: 401, json: {} });
    if (path.endsWith("/platform"))
      return route.fulfill({
        json: { maintenance: false, registrationOpen: true },
      });
    if (path.endsWith("/auth/forgot-password"))
      return route.fulfill({
        status: 202,
        json: { message: "Check your inbox" },
      });
    if (path.endsWith("/auth/reset-password-email")) {
      expect(route.request().postDataJSON()).toEqual({
        email: "member@example.test",
        code: "123456",
        password: "replacement-password",
      });
      return route.fulfill({
        json: { message: "Password reset successfully" },
      });
    }
    return route.fulfill({ json: { items: [] } });
  });
  await page.goto("/forgot-password");
  await expect(
    page.getByRole("button", { name: "Recovery key", exact: true }),
  ).toHaveCount(0);
  await page
    .getByLabel("Email address", { exact: true })
    .fill("member@example.test");
  await page
    .getByRole("button", { name: "Send reset code", exact: true })
    .click();
  await page.getByLabel("Verification code", { exact: true }).fill("123456");
  await page
    .getByLabel("New password", { exact: true })
    .fill("replacement-password");
  await page
    .getByLabel("Confirm new password", { exact: true })
    .fill("replacement-password");
  await page
    .getByRole("button", { name: "Reset password", exact: true })
    .click();
  await expect(page).toHaveURL(/\/login$/);
});

test("clean settings hide advanced controls and confirm sensitive actions", async ({
  page,
}, info) => {
  let logoutCalls = 0,
    deleteCalls = 0,
    deleted = false;
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me") && deleted)
      return route.fulfill({ status: 401, json: {} });
    if (path.endsWith("/auth/me"))
      return route.fulfill({
        json: {
          csrf: "fixture",
          user: {
            id: "111111111111111111111111",
            name: "Member",
            email: "member@example.test",
            roles: ["user"],
            profileCompleted: true,
            emailVerified: true,
          },
        },
      });
    if (path.endsWith("/platform"))
      return route.fulfill({
        json: { maintenance: false, registrationOpen: true },
      });
    if (path.endsWith("/auth/logout-all")) {
      logoutCalls++;
      return route.fulfill({
        status: 503,
        json: { error: { message: "Please try again" } },
      });
    }
    if (path.endsWith("/account") && route.request().method() === "DELETE") {
      deleteCalls++;
      expect(route.request().postDataJSON()).toEqual({ confirm: true });
      expect(route.request().headers()["x-csrf-token"]).toBe("fixture");
      if (deleteCalls === 1)
        return route.fulfill({
          status: 503,
          json: { error: { message: "Deletion temporarily unavailable" } },
        });
      deleted = true;
      return route.fulfill({ json: { ok: true } });
    }
    return route.fulfill({ json: { items: [] } });
  });
  await page.goto("/dashboard?tab=settings");
  await expect(
    page.getByText("Account recovery key", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Export my data", exact: true }),
  ).not.toBeVisible();
  await page
    .getByRole("button", { name: "Sign out everywhere", exact: true })
    .click();
  let dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(logoutCalls).toBe(0);
  await page
    .getByRole("button", { name: "Sign out everywhere", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "Sign out everywhere", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText("Please try again");
  expect(logoutCalls).toBe(1);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Delete my account", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await expect(dialog.locator('input[type="password"]')).toHaveCount(0);
  await dialog.getByRole("button", { name: "No", exact: true }).click();
  expect(deleteCalls).toBe(0);
  await page
    .getByRole("button", { name: "Delete my account", exact: true })
    .click();
  await dialog.getByRole("button", { name: "Yes", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText(
    "Deletion temporarily unavailable",
  );
  expect(deleteCalls).toBe(1);
  await dialog.getByRole("button", { name: "No", exact: true }).click();
  await page.screenshot({
    path: `.runtime/settings-clean-${info.project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Delete my account", exact: true })
    .click();
  await dialog.getByRole("button", { name: "Yes", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator(".account-trigger")).toHaveCount(0);
  expect(deleteCalls).toBe(2);
});
