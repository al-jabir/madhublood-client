import { test, expect } from "@playwright/test";

test("home and donor search list only address names for the chosen area type", async ({
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
      return route.fulfill({ status: 401, json: {} });
    if (path.endsWith("/locations"))
      return route.fulfill({
        json: {
          items: [
            {
              _id: "111111111111111111111111",
              name: "Madhupur",
              kind: "municipality",
            },
            {
              _id: "222222222222222222222222",
              name: "Ward One",
              kind: "locality",
            },
            {
              _id: "333333333333333333333333",
              name: "Union Village",
              kind: "union",
            },
          ],
        },
      });
    return route.fulfill({ json: { items: [], total: 0 } });
  });
  for (const [url, typeId, areaId] of [
    ["/", "search-location-type", "search-locality"],
    ["/donors", "results-type", "results-area"],
  ]) {
    await page.goto(url);
    const type = page.locator(`#${typeId}`),
      area = page.locator(`#${areaId}`);
    await expect(area.locator("option")).toHaveCount(4);
    await expect(area.locator("optgroup")).toHaveCount(0);
    await type.selectOption("municipality");
    await expect(area.locator("option")).toHaveText([
      /Select an area|Anywhere in Madhupur/,
      "Madhupur",
      "Ward One",
    ]);
    await area.selectOption("Ward One");
    await type.selectOption("union");
    await expect(area).toHaveValue("");
    await expect(area.locator("option")).toHaveText([
      /Select an area|Anywhere in Madhupur/,
      "Union Village",
    ]);
    await expect(area.locator("optgroup")).toHaveCount(0);
    await type.selectOption("");
    await expect(area.locator("option")).toHaveCount(4);
  }
});
