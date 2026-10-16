import { test, expect } from "@playwright/test";
test("demo examples are clearly labeled and admin can clear only demos", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "madhublood-preferences",
      JSON.stringify({ state: { en: true, dark: false }, version: 0 }),
    ),
  );
  let count = 50;
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me"))
      return route.fulfill({
        json: {
          csrf: "test",
          user: {
            id: "111111111111111111111111",
            name: "Demo admin",
            roles: ["admin"],
            profileCompleted: true,
            emailVerified: true,
          },
        },
      });
    if (path.endsWith("/demo-data")) {
      if (route.request().method() === "DELETE") count = 0;
      if (route.request().method() === "POST") count = 50;
      return route.fulfill({
        json: {
          total: count,
          items: Array.from({ length: count }, (_, i) => ({
            kind: i < 25 ? "donor" : "request",
            name: `Example ${i}`,
            bloodGroup: "A+",
            area: "Example area",
            units: 1,
          })),
        },
      });
    }
    if (path.endsWith("/queue"))
      return route.fulfill({ json: { requests: [], donors: [] } });
    return route.fulfill({
      json: { items: [], total: 0, requests: [], donors: [] },
    });
  });
  await page.goto("/");
  await expect(
    page.getByText("DEMO · Fictional examples", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".demo-examples .donor-card")).toHaveCount(9);
  await page
    .locator(".demo-examples")
    .getByRole("button", { name: "Next" })
    .click();
  await expect(page.locator(".demo-examples")).toContainText("2 / 6");
  await page.goto("/faq");
  await expect(
    page.getByRole("heading", { name: "How do I request blood?" }),
  ).toBeVisible();
  await page.goto("/how-it-works");
  await expect(
    page.getByRole("heading", { name: "4. Coordinate with the hospital" }),
  ).toBeVisible();
  await page.goto("/admin");
  if (test.info().project.name === "mobile")
    await page.getByRole("button", { name: "Toggle admin navigation" }).click();
  await page.getByRole("link", { name: "Demo data", exact: true }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Clear all demos" }).click();
  await expect(
    page.getByText("0 demo examples", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Generate 50 demos" }).click();
  await expect(
    page.getByText("50 demo examples", { exact: true }),
  ).toBeVisible();
});
