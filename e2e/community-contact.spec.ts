import { test, expect } from "@playwright/test";
test("home shows real API counts and consented requester contact has a call action", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "madhublood-preferences",
      JSON.stringify({ state: { en: true, dark: false }, version: 0 }),
    ),
  );
  let donorReady = false;
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/donors/me"))
      return route.fulfill({
        json: donorReady
          ? {
              _id: "333333333333333333333333",
              bloodGroup: "A+",
              available: true,
              contactConsent: true,
            }
          : null,
      });
    if (path.endsWith("/auth/me"))
      return route.fulfill({
        json: {
          csrf: "test",
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
    if (path.endsWith("/community-stats"))
      return route.fulfill({
        json: {
          activeRequests: 7,
          availableDonors: 13,
          recordedDonations: 32,
          contributingDonors: 19,
        },
      });
    if (path.endsWith("/blood-requests/222222222222222222222222"))
      return route.fulfill({
        json: {
          id: "222222222222222222222222",
          bloodGroup: "A+",
          hospital: "Test hospital",
          area: "Test area",
          requiredAt: "2026-12-01T10:00:00.000Z",
          units: 1,
          component: "whole-blood",
          status: "active",
          contact: "01712345678",
        },
      });
    return route.fulfill({ json: { items: [], total: 0 } });
  });
  await page.goto("/");
  await expect(page.locator(".community-live-grid")).toContainText("32");
  await expect(page.locator(".community-live-grid")).toContainText("19");
  await expect(page.locator(".community-live-section")).toContainText(
    "not hospital-verified",
  );
  await page.goto("/requests/222222222222222222222222");
  await expect(
    page.getByRole("link", { name: "Call requester" }),
  ).toHaveAttribute("href", "tel:01712345678");
  await expect(
    page.getByText("Your donor profile has not been set up yet.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "I want to donate", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("link", { name: "Review my donor details" }),
  ).toHaveAttribute("href", "/dashboard?tab=donor");
  donorReady = true;
  await page.reload();
  await expect(
    page.getByRole("button", { name: "I want to donate", exact: true }),
  ).toBeEnabled();
  await page.goto("/requests/new");
  await expect(
    page.getByRole("checkbox", {
      name: "Show my contact number to signed-in users while this request is active.",
    }),
  ).not.toBeChecked();
});
