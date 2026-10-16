import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("Bangla home, blood group filtering, consent form and language preferences", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/MadhuBlood/);
  await expect(page.locator("html")).toHaveAttribute("lang", "bn");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "আপনার এক ব্যাগ রক্ত",
  );
  await page.screenshot({
    path: `.runtime/home-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByLabel("Blood group", { exact: true }).selectOption("O+");
  await page.locator(".quick-controls button").click();
  await expect(page).toHaveURL(/bloodGroup=O%2B/);
  await expect(page.locator(".filter-bar select")).toHaveValue("O+");
  await page.getByRole("button", { name: "Change language" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Find a blood donor",
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
    page.getByRole("heading", { name: /Sign in required/ }),
  ).toBeVisible();
  await page.goto("/unknown-route");
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back home" })).toHaveAttribute(
    "href",
    "/",
  );
});
