import { test, expect } from "@playwright/test";
test("result filters preserve area, clear correctly and fit the screen", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "madhublood-preferences",
      JSON.stringify({ state: { en: true, dark: true }, version: 0 }),
    ),
  );
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me"))
      return route.fulfill({ status: 401, json: {} });
    if (path.endsWith("/locations"))
      return route.fulfill({
        json: {
          items: [
            { _id: "1", name: "Town ward", kind: "locality" },
            { _id: "2", name: "Test union", kind: "union" },
          ],
        },
      });
    return route.fulfill({ json: { items: [], total: 0 } });
  });
  await page.goto("/donors?area=Town+ward&locality=Town+ward&available=true");
  await expect(page.locator("header nav a.active")).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  await expect(page.locator(".donor-search-panel")).toHaveClass(
    /dark-search-box/,
  );
  await expect(page.getByLabel("Area", { exact: true })).toHaveValue(
    "Town ward",
  );
  await page.getByLabel("Blood group", { exact: true }).selectOption("A+");
  expect(new URL(page.url()).searchParams.get("area")).toBe("Town ward");
  await page.getByLabel("Area type", { exact: true }).selectOption("union");
  await page.getByLabel("Area", { exact: true }).selectOption("Test union");
  expect(new URL(page.url()).searchParams.get("union")).toBe("Test union");
  expect(new URL(page.url()).searchParams.has("locality")).toBe(false);
  await expect(page.getByText("0 donors found", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `.runtime/donor-results-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.getByLabel("Area", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Blood group", { exact: true })).toHaveValue("");
  expect(new URL(page.url()).search).toBe("");
});
