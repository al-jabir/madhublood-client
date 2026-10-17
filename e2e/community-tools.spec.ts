import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
const id = "222222222222222222222222",
  userId = "111111111111111111111111";
const request = {
  id,
  owner: userId,
  hospital: "Madhupur General Hospital",
  bloodGroup: "A+",
  component: "whole-blood",
  units: 2,
  area: "Madhupur, Tangail",
  urgency: "critical",
  requiredAt: "2027-12-20T12:00:00Z",
  status: "active",
  contact: "01799999999",
};
async function prefs(page: Page) {
  await page.addInitScript(() =>
    localStorage.setItem(
      "madhublood-preferences",
      JSON.stringify({ state: { en: true, dark: true }, version: 0 }),
    ),
  );
}
const me = (roles = ["user"]) => ({
  csrf: "test",
  user: {
    id: userId,
    name: "Test member",
    email: "member@example.test",
    roles,
    profileCompleted: true,
    emailVerified: true,
  },
});

test("coordinator opens an overdue callback in the assigned request workspace", async ({
  page,
}) => {
  await prefs(page);
  const second = "777777777777777777777777";
  const summary = { required: 2, arranged: 0, arrived: 0, remaining: 2 },
    coordinator = { id: userId, name: "Coordinator" };
  await page.route("**/api/v1/**", (route) => {
    const p = new URL(route.request().url()).pathname;
    if (p.endsWith("/auth/me"))
      return route.fulfill({ json: me(["volunteer"]) });
    if (p.endsWith("/coordination-tasks"))
      return route.fulfill({
        json: {
          items: [
            {
              requestId: second,
              hospital: "Second hospital",
              bloodGroup: "A+",
              donorId: "888888888888888888888888",
              name: "Callback donor",
              outcome: "will-confirm",
              due: true,
              nextContactAt: "2026-01-01T12:00:00Z",
            },
          ],
          page: 1,
          totalRequests: 2,
        },
      });
    if (p.endsWith("/admin/coordination"))
      return route.fulfill({
        json: {
          items: [
            { ...request, summary, coordinator, confirmed: false },
            {
              ...request,
              id: second,
              hospital: "Second hospital",
              summary,
              coordinator,
              confirmed: false,
            },
          ],
          total: 2,
          page: 1,
          canAssign: false,
        },
      });
    if (
      p.endsWith(`/coordination/${id}`) ||
      p.endsWith(`/coordination/${second}`)
    )
      return route.fulfill({
        json: {
          request: {
            ...request,
            ...(p.endsWith(second)
              ? { id: second, hospital: "Second hospital" }
              : {}),
          },
          summary,
          coordinator,
          confirmed: false,
          canAssign: false,
          canUpdate: true,
          candidates: [],
          donors: [],
        },
      });
    return route.fulfill({ json: { items: [], total: 0 } });
  });
  await page.goto("/admin?section=coordination");
  await expect(
    page.getByText("Callback overdue", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open request", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Second hospital", exact: true }),
  ).toBeInViewport();
  await expect(
    page.getByLabel("Assigned coordinator", { exact: true }),
  ).toHaveCount(0);
});
test("urgent feed filters server data and shows the correct language announcement", async ({
  page,
}) => {
  await prefs(page);
  let query: URLSearchParams | undefined;
  await page.route("**/api/v1/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/auth/me"))
      return route.fulfill({
        status: 401,
        json: { error: { message: "Please sign in" } },
      });
    if (url.pathname.endsWith("/community-announcement"))
      return route.fulfill({
        json: {
          enabled: true,
          titleBn: "রক্তদান কর্মসূচি",
          titleEn: "Blood donation drive",
          bodyBn: "আমাদের সঙ্গে থাকুন",
          bodyEn: "Join your community",
          expiresAt: null,
        },
      });
    if (url.pathname.endsWith("/blood-requests/urgent")) {
      query = url.searchParams;
      return route.fulfill({
        json: {
          items: url.searchParams.has("bloodGroup") ? [] : [request],
          total: url.searchParams.has("bloodGroup") ? 0 : 1,
          page: 1,
        },
      });
    }
    return route.fulfill({ json: { items: [], total: 0 } });
  });
  await page.goto("/");
  await expect(
    page.getByText("Blood donation drive", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("রক্তদান কর্মসূচি", { exact: true })).toHaveCount(
    0,
  );
  await page.goto("/requests");
  await expect(
    page.getByRole("heading", { name: "Urgent blood requests", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: request.hospital, exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: `.runtime/urgent-feed-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByLabel("Blood group", { exact: true }).selectOption("O+");
  await expect(
    page.getByText("No open urgent requests match these filters."),
  ).toBeVisible();
  expect(query?.get("bloodGroup")).toBe("O+");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("owner timeline, private donor suggestions and downloadable public share image", async ({
  page,
}) => {
  await prefs(page);
  await page.route("**/api/v1/**", (route) => {
    const p = new URL(route.request().url()).pathname;
    if (p.endsWith("/auth/me")) return route.fulfill({ json: me() });
    if (p.endsWith("/timeline"))
      return route.fulfill({
        json: {
          status: "active",
          items: [
            { id: "event1", event: "submitted", at: "2027-01-01T12:00:00Z" },
            { id: "event2", event: "active", at: "2027-01-01T13:00:00Z" },
          ],
        },
      });
    if (p.endsWith("/suggestions"))
      return route.fulfill({
        json: {
          items: [
            {
              id: "333333333333333333333333",
              name: "Public donor",
              bloodGroup: "A+",
              area: "Madhupur, Tangail",
              available: true,
              verified: true,
            },
          ],
        },
      });
    if (p.endsWith(`/blood-requests/${id}`))
      return route.fulfill({ json: request });
    if (p.endsWith("/coordination-progress"))
      return route.fulfill({ json: { managed: false } });
    return route.fulfill({ json: { items: [], total: 0 } });
  });
  await page.goto(`/requests/${id}`);
  await expect(
    page.getByRole("heading", { name: "Request timeline" }),
  ).toBeVisible();
  await expect(page.getByText("Public donor", { exact: true })).toBeVisible();
  expect(
    await page
      .getByRole("link", { name: "Share to WhatsApp" })
      .getAttribute("href"),
  ).not.toContain("01799999999");
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download share card", exact: true })
    .click();
  const download = await pending;
  await download.saveAs(`.runtime/share-card-${test.info().project.name}.png`);
  const bytes = await readFile((await download.path())!);
  expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(bytes.length).toBeGreaterThan(5000);
});
test("admin publishes bilingual announcements and marks potential duplicates reviewed", async ({
  page,
}) => {
  await prefs(page);
  page.on("dialog", (d) => d.accept());
  let reviewed = false;
  let announcement: unknown = null;
  const writes: string[] = [];
  await page.route("**/api/v1/**", (route) => {
    const p = new URL(route.request().url()).pathname;
    if (p.endsWith("/auth/me"))
      return route.fulfill({ json: me(["super-admin"]) });
    if (p.endsWith("/community-announcement")) {
      if (route.request().method() === "PUT") {
        announcement = route.request().postDataJSON();
        writes.push(p);
        return route.fulfill({ json: { ok: true } });
      }
      return route.fulfill({ json: announcement });
    }
    if (p.endsWith(`/community-review/${id}`)) {
      reviewed = true;
      writes.push(p);
      return route.fulfill({ json: { ok: true } });
    }
    if (p.endsWith("/community-review"))
      return route.fulfill({
        json: {
          items: reviewed
            ? []
            : [{ ...request, reasons: ["similar-request"], similar: 1 }],
          page: 1,
          hasMore: false,
        },
      });
    return route.fulfill({ json: { items: [], total: 0 } });
  });
  await page.goto("/admin?section=community");
  await page.getByRole("checkbox", { name: "Publish announcement" }).check();
  for (const [label, value] of [
    ["Bangla title", "রক্তদান কর্মসূচি"],
    ["English title", "Donation drive"],
    ["Bangla message", "সবার জন্য ঘোষণা"],
    ["English message", "Community notice"],
  ])
    await page.getByRole("textbox", { name: label, exact: true }).fill(value);
  await page
    .getByRole("button", { name: "Save announcement", exact: true })
    .click();
  await expect
    .poll(() => announcement)
    .toMatchObject({
      enabled: true,
      titleEn: "Donation drive",
      bodyBn: "সবার জন্য ঘোষণা",
    });
  await page
    .getByRole("button", { name: "Mark reviewed", exact: true })
    .click();
  await expect(
    page.getByText("No new review signals on this page."),
  ).toBeVisible();
  expect(writes.some((p) => p.includes("blood-requests"))).toBe(false);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `.runtime/community-admin-${test.info().project.name}.png`,
    fullPage: true,
  });
});
test("stale availability can be reconfirmed without changing contact consent", async ({
  page,
}) => {
  await prefs(page);
  let stale = true;
  let available: boolean | undefined;
  await page.route("**/api/v1/**", (route) => {
    const p = new URL(route.request().url()).pathname;
    if (p.endsWith("/auth/me")) return route.fulfill({ json: me() });
    if (p.endsWith("/availability-check"))
      return route.fulfill({
        json: {
          exists: true,
          stale,
          available: true,
          canEnable: true,
          updatedAt: "2026-01-01T00:00:00Z",
        },
      });
    if (p.endsWith("/confirm-availability")) {
      available = route.request().postDataJSON().available;
      stale = false;
      return route.fulfill({ json: { ok: true } });
    }
    if (p.endsWith("/donors/me")) return route.fulfill({ json: null });
    return route.fulfill({ json: { items: [], total: 0 } });
  });
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", {
      name: "Is your donor availability up to date?",
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Not available now", exact: true })
    .click();
  await expect.poll(() => available).toBe(false);
  await expect(
    page.getByRole("heading", {
      name: "Is your donor availability up to date?",
    }),
  ).toHaveCount(0);
});
