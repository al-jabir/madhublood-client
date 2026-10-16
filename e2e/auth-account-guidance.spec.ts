import { test, expect } from "@playwright/test";
test("duplicate registration guides to sign in and invalid login guides to registration without creating a session", async ({
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
    if (path.endsWith("/auth/register"))
      return route.fulfill({
        status: 409,
        json: { error: { message: "Account exists" } },
      });
    if (path.endsWith("/auth/login"))
      return route.fulfill({
        status: 401,
        json: { error: { message: "Invalid credentials" } },
      });
    if (path.endsWith("/auth/me"))
      return route.fulfill({
        status: 401,
        json: { error: { message: "Please sign in" } },
      });
    return route.fulfill({ json: { items: [], total: 0 } });
  });
  await page.goto("/register");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("existing@example.test");
  await page.getByLabel("Password", { exact: true }).fill("secret123");
  await page.getByLabel("Confirm password", { exact: true }).fill("secret123");
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("already registered");
  await page
    .locator(".auth-action-error")
    .getByRole("link", { name: "Sign in", exact: true })
    .click();
  await expect(page.getByLabel("Email address", { exact: true })).toHaveValue(
    "existing@example.test",
  );
  await page
    .getByLabel("Email address", { exact: true })
    .fill("unregistered@example.test");
  await page.getByLabel("Password", { exact: true }).fill("secret123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Create an account first",
  );
  await expect(page).toHaveURL(/\/login$/);
  await page
    .locator(".auth-action-error")
    .getByRole("link", { name: "Create account", exact: true })
    .click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByLabel("Email address", { exact: true })).toHaveValue(
    "unregistered@example.test",
  );
});
