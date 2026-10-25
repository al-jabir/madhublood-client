import { test, expect, type Page } from "@playwright/test";
const district = "444444444444444444444444",
  upazila = "555555555555555555555555";
async function setup(page: Page) {
  await page.addInitScript(
    () =>
      !localStorage.getItem("madhublood-preferences") &&
      localStorage.setItem(
        "madhublood-preferences",
        JSON.stringify({ state: { en: true, dark: true }, version: 0 }),
      ),
  );
  await page.route("**/api/ready", (route) =>
    route.fulfill({ json: { ready: true, database: "connected" } }),
  );
  await page.route("**/api/v1/**", (route) => {
    const p = new URL(route.request().url()).pathname;
    if (p.endsWith("/auth/me"))
      return route.fulfill({
        json: {
          csrf: "test",
          user: {
            id: "111111111111111111111111",
            name: "Long Administrator Name",
            roles: ["super-admin"],
            emailVerified: true,
            profileCompleted: true,
          },
        },
      });
    if (p.endsWith("/admin/analytics"))
      return route.fulfill({
        json: { donors: 125, available: 84, active: 18, completed: 209 },
      });
    if (p.endsWith("/admin/queue"))
      return route.fulfill({
        json: {
          requests: [
            {
              _id: "222222222222222222222222",
              bloodGroup: "A+",
              hospital:
                "Madhupur General Hospital and Community Emergency Department",
              area: "Madhupur, Tangail",
              status: "submitted",
            },
          ],
          donors: [
            {
              _id: "333333333333333333333333",
              displayName: "Community donor",
              area: "Madhupur, Tangail",
            },
          ],
        },
      });
    if (p.endsWith("/super-admin/users"))
      return route.fulfill({
        json: {
          items: [
            {
              _id: "333333333333333333333333",
              name: "Community coordinator",
              email: "coordinator@example.test",
              roles: ["user", "volunteer"],
              areas: ["Madhupur, Tangail"],
              profileCompleted: true,
            },
          ],
          total: 1,
        },
      });
    if (p.endsWith("/super-admin/settings"))
      return route.fulfill({
        json: {
          items: [
            { key: "maintenance", value: false },
            { key: "registrationOpen", value: true },
            { key: "supportMessage", value: "Contact our community team" },
          ],
        },
      });
    if (p.endsWith("/locations"))
      return route.fulfill({
        json: {
          items: [
            {
              _id: district,
              name: "Tangail",
              kind: "district",
              sourceUrl: "https://tangail.gov.bd/",
            },
            {
              _id: upazila,
              name: "Madhupur",
              kind: "upazila",
              parent: district,
              sourceUrl: "https://madhupur.tangail.gov.bd/",
            },
          ],
        },
      });
    if (p.endsWith("/audit-logs"))
      return route.fulfill({
        json: {
          items: [
            {
              _id: "888888888888888888888888",
              action: "coordination.ready",
              createdAt: "2026-10-17T10:00:00Z",
              target: "request-" + "longidentifier".repeat(12),
            },
          ],
        },
      });
    if (p.endsWith("/admin/reports") || p.endsWith("/admin/tickets"))
      return route.fulfill({
        json: {
          items: [
            {
              _id: "888888888888888888888888",
              status: "open",
              reason:
                "Please verify this hospital request and check the details with the requester.",
              message: "I need help completing my donor information.",
            },
          ],
        },
      });
    if (p.endsWith("/community-announcement"))
      return route.fulfill({ json: null });
    if (p.endsWith("/community-review"))
      return route.fulfill({ json: { items: [], page: 1, hasMore: false } });
    return route.fulfill({
      json: { items: [], total: 0, page: 1, canAssign: true },
    });
  });
}
test("admin pages keep records, forms and tables contained at each screen size", async ({
  page,
}) => {
  test.setTimeout(120000);
  await setup(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const section of [
    "overview",
    "requests",
    "donors",
    "users",
    "reports",
    "tickets",
    "audit-logs",
    "settings",
    "locations",
    "community",
    "coordination",
    "demo-data",
  ]) {
    await page.goto(`/admin?section=${section}`);
    await expect(page.locator(".admin-page-heading h1")).toBeVisible();
    await expect(page.locator(".blood-preloader, .blood-loader")).toHaveCount(
      0,
    );
    if (section === "overview")
      await expect(
        page.getByRole("heading", { name: "Available donors", exact: true }),
      ).toBeVisible();
    if (section === "requests")
      await expect(
        page.getByRole("button", { name: "Start review", exact: true }),
      ).toBeVisible();
    if (section === "settings")
      await expect(
        page.getByRole("checkbox", { name: "Maintenance mode", exact: true }),
      ).toBeVisible();
    if (section === "locations")
      await expect(
        page.getByRole("heading", { name: "Location directory" }),
      ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `${section} overflow`,
    ).toBe(true);
    if (["overview", "reports", "settings", "locations"].includes(section))
      await page.screenshot({
        path: `.runtime/admin-audit-${section}-${test.info().project.name}.png`,
        fullPage: true,
      });
  }
  expect(errors).toEqual([]);
  if (test.info().project.name === "mobile") {
    await page.getByRole("button", { name: "Toggle admin navigation" }).click();
    await expect(page.locator(".admin-sidebar")).toHaveClass(/is-open/);
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Toggle admin navigation" }),
    ).toBeFocused();
    await expect(page.locator(".admin-sidebar")).not.toHaveClass(/is-open/);
    await page.setViewportSize({ width: 320, height: 740 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
test("admin uses Bangla labels consistently and location import accepts a valid parent", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/admin?section=overview");
  await page.getByRole("button", { name: "Change language" }).click();
  await expect(
    page.getByRole("heading", { name: "রক্তদানে প্রস্তুত", exact: true }),
  ).toBeVisible();
  await page.goto("/admin?section=settings");
  await expect(
    page.getByRole("heading", { name: "সাইটের নিয়ন্ত্রণ" }),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "রক্ষণাবেক্ষণ মোড", exact: true }),
  ).toBeVisible();
  await page.goto("/admin?section=locations");
  await page.getByLabel("এলাকার ধরন", { exact: true }).selectOption("union");
  await page.getByLabel("মূল এলাকা", { exact: true }).selectOption(upazila);
  await page.getByLabel("এলাকার নাম", { exact: true }).fill("Test union");
  await page
    .getByLabel("সরকারি উৎসের লিংক", { exact: true })
    .fill("https://madhupur.tangail.gov.bd/");
  let payload: unknown;
  await page.route("**/super-admin/locations", (route) => {
    payload = route.request().postDataJSON();
    return route.fulfill({ json: { ok: true } });
  });
  await page
    .getByRole("button", { name: "যাচাইকৃত এলাকা সংযোজন", exact: true })
    .click();
  await expect
    .poll(() => payload)
    .toMatchObject({ name: "Test union", kind: "union", parent: upazila });
});
