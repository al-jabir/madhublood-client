import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "madhublood-preferences",
      JSON.stringify({ state: { en: true, dark: false }, version: 0 }),
    ),
  );
});

test("empty API responses never become invented requests, donors or donation counts", async ({
  page,
}) => {
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/locations"))
      expect(
        Number(new URL(route.request().url()).searchParams.get("limit")),
      ).toBeLessThanOrEqual(50);
    if (path.endsWith("/auth/me"))
      return route.fulfill({
        status: 401,
        json: { error: { message: "Please sign in" } },
      });
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
  await page.goto("/");
  await expect(
    page.getByText("There are no active blood requests right now."),
  ).toBeVisible();
  await expect(
    page.getByText("No available donors are listed right now."),
  ).toBeVisible();
  await expect(
    page.locator(".urgent-req-card, .donor-showcase-card"),
  ).toHaveCount(0);
  await page.goto("/login");
  await expect(page.locator(".auth-story .eyebrow-label")).toHaveCSS(
    "text-decoration-line",
    "none",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `.runtime/auth-clean-${test.info().project.name}.png`,
    fullPage: true,
  });
});

test("quick request survives sign-in without putting private contact or hospital in the URL", async ({
  page,
}) => {
  let signedIn = false;
  const user = {
    id: "507f1f77bcf86cd799439011",
    name: "Member",
    email: "member@example.test",
    roles: ["user"],
    profileCompleted: true,
    emailVerified: true,
    notificationConsent: false,
  };
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/locations"))
      expect(
        Number(new URL(route.request().url()).searchParams.get("limit")),
      ).toBeLessThanOrEqual(50);
    if (path.endsWith("/auth/login")) {
      signedIn = true;
      return route.fulfill({ json: { user, csrf: "fixture-csrf" } });
    }
    if (path.endsWith("/auth/me"))
      return route.fulfill({
        status: signedIn ? 200 : 401,
        json: signedIn
          ? { user, csrf: "fixture-csrf" }
          : { error: { message: "Please sign in" } },
      });
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
  await page.goto("/");
  await page
    .getByLabel("Required Blood Group", { exact: true })
    .selectOption("B+");
  await page.getByLabel("Mobile Number", { exact: true }).fill("01712345678");
  await page.getByLabel("Units (Bags)", { exact: true }).fill("2");
  await page
    .getByLabel("Hospital & Area", { exact: true })
    .fill("Private fixture hospital");
  await page
    .getByRole("button", { name: "Post Emergency Blood Request", exact: true })
    .click();
  await expect(page).toHaveURL(/\/requests\/new$/);
  await page
    .locator("main")
    .getByRole("link", { name: "Sign in", exact: true })
    .click();
  await page.getByLabel("Email address", { exact: true }).fill(user.email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("fixture-test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/requests\/new$/);
  await expect(page.locator('input[name="contact"]')).toHaveValue(
    "01712345678",
  );
  await expect(page.locator('input[name="hospital"]')).toHaveValue(
    "Private fixture hospital",
  );
  await expect(page.locator('input[name="units"]')).toHaveValue("2");
  await expect(page.locator('select[name="bloodGroup"]')).toHaveValue("B+");
});

test("home search narrows areas and submits the selected filters", async ({
  page,
}) => {
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/locations"))
      expect(
        Number(new URL(route.request().url()).searchParams.get("limit")),
      ).toBeLessThanOrEqual(50);
    if (path.endsWith("/auth/me"))
      return route.fulfill({ status: 401, json: {} });
    if (path.endsWith("/locations"))
      return route.fulfill({
        json: {
          items: [
            { _id: "1", name: "Town ward", kind: "locality" },
            { _id: "2", name: "Test union", kind: "union" },
          ],
          total: 2,
        },
      });
    return route.fulfill({ json: { items: [], total: 0 } });
  });
  await page.goto("/");
  await page.locator("#search-blood").selectOption("A+");
  await page.locator("#search-location-type").selectOption("municipality");
  await expect(page.locator("#search-locality optgroup")).toHaveCount(0);
  await expect(page.locator("#search-locality option")).toHaveCount(2);
  await page.locator("#search-locality").selectOption("Town ward");
  await page.locator("#search-location-type").selectOption("union");
  await expect(page.locator("#search-locality optgroup")).toHaveCount(0);
  await expect(page.locator("#search-locality")).toHaveValue("");
  await expect(page.locator("#search-locality option")).toHaveCount(2);
  await page.locator("#search-locality").selectOption("Test union");
  await expect(page.locator(".dark-checkbox-row")).toHaveCSS(
    "border-top-width",
    "0px",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator(".btn-dark-search").click();
  await expect(page).toHaveURL(/\/donors\?/);
  const query = new URL(page.url()).searchParams;
  expect(query.get("bloodGroup")).toBe("A+");
  expect(query.get("union")).toBe("Test union");
  expect(query.get("locality")).toBeNull();
  expect(query.get("available")).toBe("true");
});
