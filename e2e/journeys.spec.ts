import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me"))
      return route.fulfill({ status: 401, json: {} });
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
});
test("Bangla home, blood group filtering, consent form and language preferences", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/MadhuBlood/);
  await expect(page.locator("html")).toHaveAttribute("lang", "bn");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "রক্তের বন্ধনে",
  );
  await page.screenshot({
    path: `.runtime/home-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByLabel("Blood group", { exact: true }).selectOption("O+");
  await page.locator(".dark-search-form button[type=submit]").click();
  await expect(page).toHaveURL(/bloodGroup=O%2B/);
  await expect(page.locator("#results-blood")).toHaveValue("O+");
  if (test.info().project.name === "mobile") {
    await page.getByRole("button", { name: "Toggle navigation" }).click();
    await page.getByRole("button", { name: "English", exact: true }).click();
  } else await page.getByRole("button", { name: "Change language" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Find Blood Donors",
  );
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.goto("/register");
  await expect(
    page.getByRole("button", { name: "Create account", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByRole("alert").first()).toBeVisible();
  await expect(page).toHaveURL(/register/);
  await expect(page.locator("body")).not.toHaveJSProperty("scrollWidth", 0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("home and registration accessibility", async ({ page }) => {
  for (const path of ["/", "/register", "/donors", "/requests/new"]) {
    await page.goto(path);
    await page.locator("h1").first().waitFor();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      result.violations,
      JSON.stringify(result.violations, null, 2),
    ).toEqual([]);
  }
});
test("private workflow is gated and unknown routes offer recovery", async ({
  page,
}) => {
  await page.goto("/requests/new");
  await expect(
    page.getByRole("heading", { name: "লগ ইন প্রয়োজন" }),
  ).toBeVisible();
  await page.goto("/unknown-route");
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  await expect(page.getByRole("link", { name: "হোমে ফিরুন" })).toHaveAttribute(
    "href",
    "/",
  );
});
