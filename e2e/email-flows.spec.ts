import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "madhublood-preferences",
      JSON.stringify({ state: { en: true, dark: false }, version: 0 }),
    ),
  );
});

test("email reset requests a generic code, handles invalid codes and clears the session on success", async ({
  page,
}) => {
  let requests = 0;
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me"))
      return route.fulfill({
        status: 401,
        json: { error: { message: "Please sign in" } },
      });
    if (path.endsWith("/auth/forgot-password")) {
      expect(route.request().postDataJSON()).toEqual({
        email: "member@example.test",
      });
      requests++;
      return route.fulfill({
        status: 202,
        json: { message: "If eligible, a code is queued. Check your inbox." },
      });
    }
    if (path.endsWith("/auth/reset-password-email")) {
      const body = route.request().postDataJSON();
      expect(body.email).toBe("member@example.test");
      expect(body.password).toBe("a-new-secure-password");
      return body.code === "123456"
        ? route.fulfill({
            json: { message: "Password reset successfully. Sign in again." },
          })
        : route.fulfill({
            status: 400,
            json: { error: { message: "Invalid or expired email code" } },
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
    return route.fulfill({ json: { items: [], total: 0 } });
  });
  await page.goto("/forgot-password");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("member@example.test");
  await page
    .getByRole("button", { name: "Send reset code", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("If eligible");
  expect(requests).toBe(1);
  await expect(
    page.getByRole("button", { name: /Resend available in/ }),
  ).toBeDisabled();
  await page.getByLabel("Verification code", { exact: true }).fill("111111");
  await page
    .getByLabel("New password", { exact: true })
    .fill("a-new-secure-password");
  await page
    .getByLabel("Confirm new password", { exact: true })
    .fill("a-new-secure-password");
  await page
    .getByRole("button", { name: "Reset password", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Invalid or expired");
  await page.getByLabel("Verification code", { exact: true }).fill("123456");
  await page
    .getByRole("button", { name: "Reset password", exact: true })
    .click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("status")).toContainText(
    "Password reset successfully",
  );
});

test("profile verification uses account email and refreshes verification status", async ({
  page,
}) => {
  let verified = false;
  const user = {
    id: "507f1f77bcf86cd799439011",
    name: "Member",
    email: "member@example.test",
    roles: ["user"],
    profileCompleted: true,
    notificationConsent: false,
  };
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me"))
      return route.fulfill({
        json: {
          user: { ...user, emailVerified: verified },
          csrf: "fixture-csrf",
        },
      });
    if (path.endsWith("/auth/verify-email")) {
      expect(route.request().postDataJSON()).toEqual({
        email: user.email,
        code: "123456",
      });
      expect(route.request().headers()["x-csrf-token"]).toBe("fixture-csrf");
      verified = true;
      return route.fulfill({
        json: { message: "Email verified successfully." },
      });
    }
    if (path.endsWith("/auth/request-email-verification"))
      return route.fulfill({
        status: 202,
        json: { message: "If eligible, a code is queued." },
      });
    if (path.endsWith("/donors/me")) return route.fulfill({ json: null });
    if (path.endsWith("/platform"))
      return route.fulfill({
        json: {
          maintenance: false,
          registrationOpen: true,
          supportMessage: "",
        },
      });
    return route.fulfill({ json: { items: [], total: 0 } });
  });
  await page.goto("/verify-email");
  await expect(page.getByLabel("Email address", { exact: true })).toHaveValue(
    user.email,
  );
  await page
    .getByRole("button", { name: "Send a new code", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Resend available in/ }),
  ).toBeDisabled();
  await page.getByLabel("Verification code", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "Verify email", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page
    .locator(".dashboard-tabs")
    .getByRole("button", { name: "Profile", exact: true })
    .click();
  await expect(page.getByText("Verified", { exact: true })).toBeVisible();
});

test("new account and recovery forms remain accessible and fit the viewport", async ({
  page,
}) => {
  await page.route("**/api/v1/**", (route) =>
    route.fulfill({
      status: 401,
      json: { error: { message: "Please sign in" } },
    }),
  );
  for (const path of ["/login", "/forgot-password", "/verify-email"]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations,
      JSON.stringify(result.violations, null, 2),
    ).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.screenshot({
    path: `test-results/email-${test.info().project.name}.png`,
    fullPage: true,
  });
});
