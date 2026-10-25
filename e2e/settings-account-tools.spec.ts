import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "madhublood-preferences",
      JSON.stringify({ state: { en: true, dark: true }, version: 0 }),
    ),
  );
});
const member = {
  id: "111111111111111111111111",
  name: "Member",
  email: "old@example.test",
  phone: "01712345678",
  roles: ["user"],
  profileCompleted: true,
  emailVerified: true,
};
test("email change preserves the old email until verification and requires signing in again", async ({
  page,
}) => {
  let signedIn = true,
    requestCount = 0;
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me"))
      return route.fulfill({
        status: signedIn ? 200 : 401,
        json: signedIn ? { user: member, csrf: "fixture" } : {},
      });
    if (path.endsWith("/platform"))
      return route.fulfill({
        json: { maintenance: false, registrationOpen: true },
      });
    if (path.endsWith("/account/email-change/request")) {
      requestCount++;
      const data = route.request().postDataJSON();
      expect(data.newEmail).toBe("new@example.test");
      return data.currentPassword === "correct-password"
        ? route.fulfill({ status: 202, json: { message: "Code queued" } })
        : route.fulfill({
            status: 401,
            json: { error: { message: "Current password is incorrect" } },
          });
    }
    if (path.endsWith("/account/email-change/confirm")) {
      const data = route.request().postDataJSON();
      expect(data.newEmail).toBe("new@example.test");
      if (data.code !== "123456")
        return route.fulfill({
          status: 400,
          json: { error: { message: "Invalid or expired email change code" } },
        });
      signedIn = false;
      return route.fulfill({ json: { message: "Email changed successfully" } });
    }
    return route.fulfill({ json: { items: [], total: 0 } });
  });
  await page.goto("/dashboard?tab=settings");
  await expect(
    page.getByRole("heading", { name: "Account status", exact: true }),
  ).toBeVisible();
  await page.getByText("Change login email", { exact: true }).click();
  const panel = page.locator(".settings-email-change");
  await panel
    .getByLabel("New email address", { exact: true })
    .fill("new@example.test");
  await panel
    .getByLabel("Current password to change email", { exact: true })
    .fill("incorrect-password");
  await panel
    .getByRole("button", { name: "Send code to new email", exact: true })
    .click();
  await expect(panel.getByRole("alert")).toContainText(
    "Current password is incorrect",
  );
  await panel
    .getByLabel("Current password to change email", { exact: true })
    .fill("correct-password");
  await panel
    .getByRole("button", { name: "Send code to new email", exact: true })
    .click();
  await expect(page.locator(".account-status-panel")).toContainText(
    "old@example.test",
  );
  expect(requestCount).toBe(2);
  await panel.getByLabel("Email change code", { exact: true }).fill("000000");
  await panel
    .getByRole("button", { name: "Confirm email change", exact: true })
    .click();
  await expect(panel.getByRole("alert")).toContainText("Invalid or expired");
  await panel.getByLabel("Email change code", { exact: true }).fill("123456");
  await panel
    .getByRole("button", { name: "Confirm email change", exact: true })
    .click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel("Email address", { exact: true })).toHaveValue(
    "new@example.test",
  );
});
test("member submits support and reads an administrator reply in Settings", async ({
  page,
}, info) => {
  let root = false;
  const tickets: Array<{
    _id: string;
    message: string;
    status: string;
    reply?: string;
  }> = [];
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me"))
      return route.fulfill({
        json: {
          user: root ? { ...member, roles: ["super-admin"] } : member,
          csrf: "fixture",
        },
      });
    if (path.endsWith("/platform"))
      return route.fulfill({
        json: { maintenance: false, registrationOpen: true },
      });
    if (path.endsWith("/account/support") || path.endsWith("/admin/tickets"))
      return route.fulfill({ json: { items: tickets } });
    if (path.endsWith("/support") && route.request().method() === "POST") {
      const message = route.request().postDataJSON().message;
      tickets.unshift({
        _id: "222222222222222222222222",
        message,
        status: "open",
      });
      return route.fulfill({ status: 201, json: tickets[0] });
    }
    if (path.endsWith("/admin/tickets/222222222222222222222222/reply")) {
      const data = route.request().postDataJSON();
      tickets[0].reply = data.reply;
      tickets[0].status = data.status;
      return route.fulfill({ json: { ok: true } });
    }
    return route.fulfill({
      json: { items: [], requests: [], donors: [], total: 0 },
    });
  });
  await page.goto("/dashboard?tab=settings");
  await page.getByText("Get help & view replies", { exact: true }).click();
  let support = page.locator(".settings-support");
  await support
    .getByLabel("Your issue", { exact: true })
    .fill("My donor profile needs help");
  await support
    .getByRole("button", { name: "Send support request", exact: true })
    .click();
  await expect(support.locator(".support-history-card")).toContainText(
    "Awaiting reply",
  );
  root = true;
  await page.goto("/admin?section=tickets");
  await page.getByText("Reply to member", { exact: true }).click();
  await page
    .getByLabel("This reply is visible to the member", { exact: true })
    .fill("Open your donor form and check the selected area.");
  await page
    .getByRole("button", { name: "Reply & resolve", exact: true })
    .click();
  await expect(page.getByText("Reply sent", { exact: true })).toBeVisible();
  root = false;
  await page.goto("/dashboard?tab=settings");
  await page.getByText("Get help & view replies", { exact: true }).click();
  support = page.locator(".settings-support");
  await expect(support.locator(".support-reply")).toContainText(
    "Open your donor form",
  );
  await expect(support.locator(".badge")).toContainText("Resolved");
  await page.screenshot({
    path: `.runtime/settings-account-tools-${info.project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
