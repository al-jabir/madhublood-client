import { test, expect } from "@playwright/test";
test("signed in header and dashboard use the selected language", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "madhublood-preferences",
      JSON.stringify({ state: { en: true, dark: false }, version: 0 }),
    ),
  );
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me"))
      return route.fulfill({
        json: {
          csrf: "test-csrf",
          user: {
            id: "111111111111111111111111",
            name: "Test Donor",
            email: "donor@example.test",
            roles: ["user"],
            profileCompleted: true,
            emailVerified: true,
          },
        },
      });
    if (path.endsWith("/auth/sessions"))
      return route.fulfill({
        json: {
          items: [
            {
              id: "session-1",
              current: true,
              createdAt: "2026-10-16T10:00:00.000Z",
              expiresAt: "2026-10-23T10:00:00.000Z",
            },
          ],
        },
      });
    return route.fulfill({ json: { items: [], total: 0 } });
  });
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Welcome, Test Donor" }),
  ).toBeVisible();
  await expect(page.locator(".dashboard-page .signout")).toHaveCount(0);
  const trigger = page.locator(".account-trigger");
  await expect(trigger).toContainText("Test Donor");
  await trigger.click();
  await expect(
    page.locator(".account-dropdown").getByRole("link", { name: "My profile" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await page
    .locator(".account-dropdown")
    .getByRole("link", { name: "My profile" })
    .click();
  await expect(page.locator(".profile-overview")).toContainText("Test Donor");
  await expect(page.locator(".donor-onboarding")).toHaveCount(0);
  await page.getByRole("button", { name: "Donor form", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your donor details" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Profile", exact: true }).click();
  await page.getByRole("button", { name: "Edit profile", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Personal information", exact: true }),
  ).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.locator(".session-current-badge")).toContainText("Current");
  const spacing = await page
    .locator(".account-data-content")
    .evaluate((root) => {
      const heading = root.querySelector("h3")!.getBoundingClientRect();
      const button = root.querySelector("button")!.getBoundingClientRect();
      const field = root.querySelector(".field")!.getBoundingClientRect();
      const remove = root
        .querySelector("form > button")!
        .getBoundingClientRect();
      return {
        headingGap: button.top - heading.bottom,
        deleteGap: remove.top - field.bottom,
      };
    });
  expect(spacing.headingGap).toBeGreaterThanOrEqual(24);
  expect(spacing.deleteGap).toBeGreaterThanOrEqual(24);
  await page.screenshot({
    path: `.runtime/settings-spacing-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Profile", exact: true }).click();
  await page.getByRole("button", { name: "Edit profile", exact: true }).click();
  if (test.info().project.name === "mobile") {
    await page.getByRole("button", { name: "Toggle navigation" }).click();
    await page.getByRole("button", { name: "বাংলা", exact: true }).click();
  } else await page.getByRole("button", { name: "Change language" }).click();
  await expect(
    page.getByRole("heading", { name: "ব্যক্তিগত তথ্য", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: `.runtime/dashboard-${test.info().project.name}.png`,
    fullPage: true,
  });
});
