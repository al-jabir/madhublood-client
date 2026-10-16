import { test, expect } from "@playwright/test";
const id = "111111111111111111111111",
  locationId = "222222222222222222222222";
const key = "a".repeat(64);
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
          recoveryKey: key,
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

test("email sign-in opens profile and account recovery accepts a one-use key without sending messages", async ({
  page,
}) => {
  let signedIn = false;
  const user = {
    id,
    email: "member@example.test",
    name: "Member",
    profileCompleted: true,
    emailVerified: false,
    roles: ["user"],
    notificationConsent: false,
  };
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/login")) {
      expect(route.request().postDataJSON()).toEqual({
        email: "member@example.test",
        password: "original-password",
      });
      signedIn = true;
      return route.fulfill({ json: { user, csrf: "fixture-csrf" } });
    }
    if (path.endsWith("/auth/me"))
      return route.fulfill({
        status: signedIn ? 200 : 401,
        json: signedIn
          ? { user, csrf: "fixture-csrf" }
          : { error: { message: "Please sign in" } },
      });
    if (path.endsWith("/auth/reset-password")) {
      expect(route.request().postDataJSON()).toEqual({
        email: "member@example.test",
        recoveryKey: key,
        password: "replacement-password",
      });
      signedIn = false;
      return route.fulfill({
        json: { message: "Password reset successfully" },
      });
    }
    if (path.endsWith("/donors/me")) return route.fulfill({ json: null });
    if (path.endsWith("/platform"))
      return route.fulfill({
        json: {
          maintenance: false,
          registrationOpen: true,
          supportMessage: "",
        },
      });
    return route.fulfill({ json: { items: [] } });
  });
  await page.goto("/login");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("member@example.test");
  await page.getByLabel("Password", { exact: true }).fill("original-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/dashboard\?tab=profile/);
  await page.goto("/forgot-password");
  await page.getByRole("button", { name: "Recovery key", exact: true }).click();
  await page
    .getByLabel("Email address", { exact: true })
    .fill("member@example.test");
  await page.getByLabel("Recovery key", { exact: true }).fill(key);
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

test("replacement recovery key stays visible after sessions are revoked", async ({
  page,
}) => {
  let signedIn = true;
  const user = {
    id,
    email: "member@example.test",
    name: "Member",
    profileCompleted: true,
    emailVerified: false,
    roles: ["user"],
    notificationConsent: false,
  };
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me"))
      return route.fulfill({
        status: signedIn ? 200 : 401,
        json: signedIn
          ? { user, csrf: "fixture-csrf" }
          : { error: { message: "Please sign in" } },
      });
    if (path.endsWith("/auth/recovery-key")) {
      expect(route.request().postDataJSON()).toEqual({
        password: "original-password",
      });
      signedIn = false;
      return route.fulfill({
        json: { recoveryKey: key, message: "Recovery key replaced" },
      });
    }
    if (path.endsWith("/platform"))
      return route.fulfill({
        json: {
          maintenance: false,
          registrationOpen: true,
          supportMessage: "",
        },
      });
    return route.fulfill({ json: { items: [] } });
  });
  await page.goto("/dashboard?tab=settings");
  await page
    .getByLabel("Current password for recovery key", { exact: true })
    .fill("original-password");
  await page
    .getByRole("button", { name: "Generate replacement recovery key" })
    .click();
  await expect(page.getByLabel("New recovery key")).toHaveValue(key);
  await page.getByRole("button", { name: "I saved my key — sign in" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
