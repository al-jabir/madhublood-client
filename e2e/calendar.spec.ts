import { test, expect } from "@playwright/test";
test("modern donation calendar saves ISO dates and supports keyboard dismissal", async ({
  page,
}) => {
  let recorded = false;
  await page.addInitScript(() =>
    localStorage.setItem(
      "madhublood-preferences",
      JSON.stringify({ state: { en: true, dark: true }, version: 0 }),
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
            roles: ["user"],
            profileCompleted: true,
            emailVerified: true,
          },
        },
      });
    if (
      path.endsWith("/donors/donations") &&
      route.request().method() === "POST"
    ) {
      expect(route.request().postDataJSON()).toEqual({
        date: "2020-05-15",
        hospital: "Example hospital",
      });
      recorded = true;
      return route.fulfill({ json: { message: "Donation recorded" } });
    }
    return route.fulfill({ json: { items: [], total: 0 } });
  });
  await page.goto("/dashboard?tab=donations");
  const trigger = page.getByLabel("Donation date", { exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Choose donation date" });
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("combobox", { name: "Year", exact: true })
    .selectOption("2020");
  await dialog
    .getByRole("combobox", { name: "Month", exact: true })
    .selectOption("4");
  await dialog.getByRole("button", { name: "2020-05-15", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toContainText("2020");
  await page.getByLabel("Hospital", { exact: true }).fill("Example hospital");
  await page
    .getByRole("button", { name: "Record donation", exact: true })
    .click();
  await expect.poll(() => recorded).toBe(true);
  await trigger.click();
  await expect(dialog).toBeVisible();
  await page.screenshot({
    path: `.runtime/calendar-${test.info().project.name}.png`,
  });
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
