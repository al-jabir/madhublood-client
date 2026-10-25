import { test, expect } from "@playwright/test";
test("blood preloader waits for data, respects reduced motion and disappears when ready", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() =>
    localStorage.setItem(
      "madhublood-preferences",
      JSON.stringify({ state: { en: true, dark: false }, version: 0 }),
    ),
  );
  let release!: () => void;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me"))
      return route.fulfill({ status: 401, json: {} });
    if (path.endsWith("/donors")) {
      await ready;
      return route.fulfill({ json: { items: [], total: 0 } });
    }
    return route.fulfill({ json: { items: [], total: 0 } });
  });
  await page.goto("/donors");
  await expect(page.locator(".blood-loader")).toBeVisible();
  await expect(page.locator(".blood-loader-orbit")).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect(page.locator(".blood-loader")).toContainText(
    "Getting things ready for you",
  );
  await page.screenshot({
    path: `.runtime/blood-preloader-${test.info().project.name}.png`,
  });
  release();
  await expect(page.locator(".blood-loader")).toHaveCount(0);
  await expect(
    page.getByText("No registered donors found.", { exact: true }),
  ).toBeVisible();
});
test("initial blood preloader is visible before JavaScript starts", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5173/");
  await expect(page.locator(".boot-preloader")).toBeVisible();
  await expect(page.locator(".boot-preloader")).toContainText("MadhuBlood");
  await context.close();
});

test("admin shows one data preloader and only loads the selected section", async ({
  page,
}) => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  let queueCalls = 0;
  await page.route("**/api/ready", (route) =>
    route.fulfill({ json: { ready: true, database: "connected" } }),
  );
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me"))
      return route.fulfill({
        json: {
          csrf: "fixture",
          user: {
            id: "admin",
            name: "Admin",
            roles: ["super-admin"],
            emailVerified: true,
            profileCompleted: true,
          },
        },
      });
    if (path.endsWith("/admin/analytics")) {
      await pending;
      return route.fulfill({
        json: { donors: 0, available: 0, active: 0, completed: 0 },
      });
    }
    if (path.endsWith("/admin/queue")) {
      queueCalls++;
      return route.fulfill({ json: { requests: [], donors: [] } });
    }
    return route.fulfill({ json: { items: [] } });
  });
  await page.goto("/admin");
  await expect(page.locator(".admin-content .blood-loader")).toHaveCount(1);
  await expect(page.locator(".blood-loader:visible")).toHaveCount(1);
  expect(queueCalls).toBe(1);
  release();
  await expect(page.locator(".blood-loader")).toHaveCount(0);
  const navigation = page.getByRole("navigation", { name: "Admin navigation" });
  if (test.info().project.name === "mobile")
    await page.getByRole("button", { name: "Toggle admin navigation" }).click();
  await navigation.locator('a[href="/admin?section=requests"]').click();
  await expect.poll(() => queueCalls).toBe(2);
  await expect(page.locator(".blood-loader")).toHaveCount(0);
});

test("boot loader respects saved theme and language before the app starts", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.addInitScript(() =>
    localStorage.setItem(
      "madhublood-preferences",
      JSON.stringify({ state: { en: true, dark: false }, version: 0 }),
    ),
  );
  let release!: () => void;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/src/main.tsx", async (route) => {
    await ready;
    await route.continue();
  });
  await page.route("**/api/v1/**", (route) =>
    new URL(route.request().url()).pathname.endsWith("/auth/me")
      ? route.fulfill({ status: 401, json: {} })
      : route.fulfill({ json: { items: [], total: 0, maintenance: false } }),
  );
  try {
    await page.goto("/", { waitUntil: "commit" });
    await expect(page.locator(".boot-preloader")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator(".boot-preloader")).toHaveCSS(
      "background-color",
      "rgb(255, 254, 250)",
    );
    await expect(page.locator(".boot-copy-en")).toBeVisible();
    await expect(page.locator(".boot-copy-bn")).not.toBeVisible();
  } finally {
    release();
  }
  await expect(page.locator(".boot-preloader")).toHaveCount(0);
});

test("community administration coordinates parallel fetches into one loader", async ({
  page,
}) => {
  let releaseAnnouncement!: () => void, releaseReview!: () => void;
  const announcement = new Promise<void>((r) => {
      releaseAnnouncement = r;
    }),
    review = new Promise<void>((r) => {
      releaseReview = r;
    });
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me"))
      return route.fulfill({
        json: {
          csrf: "fixture",
          user: {
            id: "111111111111111111111111",
            roles: ["super-admin"],
            profileCompleted: true,
            emailVerified: true,
            name: "Admin",
          },
        },
      });
    if (path.endsWith("/community-announcement")) {
      await announcement;
      return route.fulfill({ json: null });
    }
    if (path.endsWith("/admin/community-review")) {
      await review;
      return route.fulfill({ json: { items: [], total: 0 } });
    }
    return route.fulfill({
      json: { items: [], maintenance: false, registrationOpen: true },
    });
  });
  try {
    await page.goto("/admin?section=community");
    await expect(page.locator(".blood-loader:visible")).toHaveCount(1);
    releaseAnnouncement();
    await expect(page.locator(".blood-loader:visible")).toHaveCount(1);
    releaseReview();
    await expect(page.locator(".blood-loader")).toHaveCount(0);
  } finally {
    releaseAnnouncement();
    releaseReview();
  }
});

test("data loader ends with a clear failure instead of staying on screen", async ({
  page,
}) => {
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me"))
      return route.fulfill({ status: 401, json: {} });
    if (path.endsWith("/donors"))
      return route.fulfill({
        status: 503,
        json: { error: { message: "Donor service unavailable" } },
      });
    return route.fulfill({
      json: { items: [], maintenance: false, registrationOpen: true },
    });
  });
  await page.goto("/donors");
  await expect(page.getByRole("alert")).toContainText(
    "Donor service unavailable",
  );
  await expect(page.locator(".blood-loader")).toHaveCount(0);
});

test("closed support panel does not run a hidden loading indicator", async ({
  page,
}) => {
  let release!: () => void;
  const ready = new Promise<void>((r) => {
    release = r;
  });
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me"))
      return route.fulfill({
        json: {
          csrf: "fixture",
          user: {
            id: "111111111111111111111111",
            name: "Member",
            roles: ["user"],
            emailVerified: true,
            profileCompleted: true,
          },
        },
      });
    if (path.endsWith("/account/support")) {
      await ready;
      return route.fulfill({ json: { items: [] } });
    }
    if (path.endsWith("/donors/me")) return route.fulfill({ json: null });
    return route.fulfill({
      json: { items: [], maintenance: false, registrationOpen: true },
    });
  });
  try {
    await page.goto("/dashboard?tab=settings");
    await expect(page.locator(".settings-support")).toBeAttached();
    await expect(page.locator(".settings-support .blood-loader")).toHaveCount(
      0,
    );
    await page.locator(".settings-support summary").click();
    await expect(page.locator(".settings-support .blood-loader")).toHaveCount(
      1,
    );
    await expect(
      page.locator(".settings-support .blood-loader strong"),
    ).toHaveCount(0);
    release();
    await expect(page.locator(".settings-support .blood-loader")).toHaveCount(
      0,
    );
  } finally {
    release();
  }
});
