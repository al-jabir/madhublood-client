import { test, expect } from "@playwright/test";
test("donor form inherits profile location, saves changes and restores the selected area after reload", async ({
  page,
}) => {
  const first = "222222222222222222222222",
    second = "333333333333333333333333";
  let saved: Record<string, unknown> | null = null;
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
          csrf: "test",
          user: {
            id: "111111111111111111111111",
            name: "Member",
            email: "member@example.test",
            roles: ["user"],
            profileCompleted: true,
            emailVerified: true,
            locationId: first,
            area: "Madhupur, Tangail",
            phone: "01712345678",
          },
        },
      });
    if (path.endsWith("/locations"))
      return route.fulfill({
        json: {
          items: [
            {
              _id: "555555555555555555555555",
              name: "Madhupur",
              kind: "upazila",
            },
            {
              _id: "666666666666666666666666",
              name: "Town ward",
              kind: "locality",
              parent: "555555555555555555555555",
            },
            {
              _id: first,
              name: "First union",
              kind: "union",
              parent: "555555555555555555555555",
            },
            {
              _id: second,
              name: "Second union",
              kind: "union",
              parent: "555555555555555555555555",
            },
          ],
        },
      });
    if (path.endsWith("/donors/me")) {
      if (route.request().method() === "PUT") {
        const input = route.request().postDataJSON();
        expect(input.locationId).toBe(second);
        expect(input.area).toContain("Second union");
        saved = {
          ...input,
          _id: "444444444444444444444444",
          area: "Madhupur, Tangail",
          locationLabel: "Second union, Madhupur, Tangail",
        };
      }
      return route.fulfill({ json: saved });
    }
    return route.fulfill({ json: { items: [], total: 0 } });
  });
  await page.goto("/dashboard?tab=donor");
  const select = page.getByRole("combobox", { name: "Select verified area" });
  await expect(select).toHaveValue(first);
  await expect(page.locator(".location-selector-wrap")).toContainText(
    "First union",
  );
  await expect(
    page.getByRole("combobox", { name: "Upazila", exact: true }),
  ).toHaveValue("555555555555555555555555");
  const areaType = page.getByRole("combobox", {
    name: "Area type",
    exact: true,
  });
  await expect(areaType).toHaveValue("union");
  await areaType.selectOption("municipality");
  await expect(select).toHaveValue("");
  await expect(select.locator("option")).toHaveCount(2);
  await select.selectOption("666666666666666666666666");
  await areaType.selectOption("union");
  await expect(select).toHaveValue("");
  await expect(select.locator("option")).toHaveCount(3);
  await select.selectOption(second);
  await page.getByLabel("Blood group", { exact: true }).selectOption("B+");
  await page.getByRole("button", { name: "Save profile & consent" }).click();
  await page.reload();
  await expect(select).toHaveValue(second);
  await expect(page.getByLabel("Blood group", { exact: true })).toHaveValue(
    "B+",
  );
  await expect(page.locator(".location-selector-wrap strong")).toContainText(
    "Second union",
  );
  await page.getByRole("button", { name: "Profile", exact: true }).click();
  await expect(page.locator(".profile-info-grid")).toContainText("First union");
});
