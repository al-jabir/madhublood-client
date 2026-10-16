import { test, expect } from "@playwright/test";

const identity = {
  user: {
    id: "test-user",
    name: "Test requester",
    phone: "+8801712345678",
    email: "fixture@example.test",
    emailVerified: false,
    profileCompleted: true,
    roles: ["super-admin"],
    notificationConsent: false,
  },
  csrf: "fixture-csrf",
};
const normalPlatform = {
  maintenance: false,
  registrationOpen: true,
  supportMessage: "",
};
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "madhublood-preferences",
      JSON.stringify({ state: { en: true, dark: false }, version: 0 }),
    ),
  );
});

test("private draft survives reload and submits after completion", async ({
  page,
}) => {
  type Draft = {
    _id: string;
    data: Record<string, unknown>;
    updatedAt: string;
  };
  let draft: Draft | null = null;
  let submitted: Record<string, unknown> | null = null;
  const draftId = "111111111111111111111111",
    requestId = "222222222222222222222222";
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    if (path.endsWith("/locations"))
      return route.fulfill({
        json: {
          items: [
            {
              _id: "333333333333333333333333",
              name: "মধুপুর",
              kind: "upazila",
            },
          ],
        },
      });
    if (path.endsWith("/auth/me")) return route.fulfill({ json: identity });
    if (path.endsWith("/platform"))
      return route.fulfill({ json: normalPlatform });
    if (path.endsWith("/blood-requests/drafts") && method === "GET")
      return route.fulfill({ json: { items: draft ? [draft] : [] } });
    if (path.endsWith("/blood-requests/drafts") && method === "POST") {
      expect(route.request().headers()["x-csrf-token"]).toBe("fixture-csrf");
      draft = {
        _id: draftId,
        data: route.request().postDataJSON(),
        updatedAt: new Date().toISOString(),
      };
      expect(draft.data.contactConsent).toBe(false);
      return route.fulfill({ status: 201, json: draft });
    }
    if (path.endsWith(`/drafts/${draftId}`) && method === "PATCH") {
      draft = {
        _id: draftId,
        data: route.request().postDataJSON(),
        updatedAt: new Date().toISOString(),
      };
      return route.fulfill({ json: draft });
    }
    if (path.endsWith(`/drafts/${draftId}/submit`)) {
      expect(draft?.data.contactConsent).toBe(true);
      submitted = {
        ...draft?.data,
        _id: requestId,
        status: "submitted",
        owner: "test-user",
      };
      draft = null;
      return route.fulfill({ status: 201, json: submitted });
    }
    if (path.endsWith(`/blood-requests/${requestId}`))
      return route.fulfill({ json: submitted });
    return route.fulfill({ json: { items: [] } });
  });
  await page.goto("/requests/new");
  await page
    .getByLabel("হাসপাতাল · Hospital", { exact: true })
    .fill("Saved hospital");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(
    page.getByText("Editing a saved draft", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(
    page.getByLabel("হাসপাতাল · Hospital", { exact: true }),
  ).toHaveValue("Saved hospital");
  await page
    .getByLabel("প্রতিনিধির নাম · Representative", { exact: true })
    .fill("Test requester");
  await page
    .getByLabel("যোগাযোগ · Mobile", { exact: true })
    .fill("+8801712345678");
  await page
    .getByLabel("প্রয়োজনের সময় · Required by", { exact: true })
    .fill(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /Submit/, exact: false }).click();
  await expect(page).toHaveURL(new RegExp(`/requests/${requestId}$`));
  expect(draft).toBeNull();
});

test("super admin settings update the public maintenance notice", async ({
  page,
}) => {
  const platform = { ...normalPlatform };
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/locations"))
      return route.fulfill({
        json: {
          items: [
            {
              _id: "333333333333333333333333",
              name: "মধুপুর",
              kind: "upazila",
            },
          ],
        },
      });
    if (path.endsWith("/auth/me")) return route.fulfill({ json: identity });
    if (path.endsWith("/platform")) return route.fulfill({ json: platform });
    if (path.endsWith("/admin/queue"))
      return route.fulfill({ json: { requests: [], donors: [] } });
    if (path.endsWith("/admin/analytics"))
      return route.fulfill({
        json: { donors: 0, available: 0, active: 0, completed: 0 },
      });
    if (path.endsWith("/super-admin/settings"))
      return route.fulfill({
        json: {
          items: Object.entries(platform).map(([key, value]) => ({
            key,
            value,
          })),
        },
      });
    if (path.includes("/super-admin/settings/")) {
      expect(route.request().method()).toBe("PUT");
      expect(route.request().headers()["x-csrf-token"]).toBe("fixture-csrf");
      const key = path.split("/").at(-1)!;
      const value: unknown = route.request().postDataJSON().value;
      if (key === "maintenance" && typeof value === "boolean")
        platform.maintenance = value;
      if (key === "registrationOpen" && typeof value === "boolean")
        platform.registrationOpen = value;
      if (key === "supportMessage" && typeof value === "string")
        platform.supportMessage = value;
      return route.fulfill({ json: { key, value } });
    }
    return route.fulfill({ json: { items: [] } });
  });
  await page.goto("/admin");
  await page.getByRole("button", { name: "settings", exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Maintenance mode", exact: true })
    .check();
  await expect(
    page.getByText(
      "Maintenance is in progress. Some services are temporarily unavailable.",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByRole("checkbox", { name: "Allow new registrations", exact: true })
    .uncheck();
  await expect(
    page.getByText("New account registration is temporarily closed.", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByLabel("Public support message", { exact: true })
    .fill("Scheduled service update");
  await page
    .getByRole("button", { name: "Save support message", exact: true })
    .click();
  await expect(
    page
      .locator("aside[role=status]")
      .getByText("Scheduled service update", { exact: true }),
  ).toBeVisible();
});
