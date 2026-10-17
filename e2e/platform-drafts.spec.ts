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
      expect(new Date(String(draft?.data.requiredAt)).getHours()).toBe(15);
      expect(new Date(String(draft?.data.requiredAt)).getMinutes()).toBe(25);
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
  await page.getByLabel("Hospital", { exact: true }).fill("Saved hospital");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(
    page.getByText("Editing a saved draft", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(page.getByLabel("Hospital", { exact: true })).toHaveValue(
    "Saved hospital",
  );
  await page
    .getByLabel("Representative", { exact: true })
    .fill("Test requester");
  await page.getByLabel("Mobile", { exact: true }).fill("01712345678");
  await page.getByLabel("Required by", { exact: true }).click();
  const future = new Date(Date.now() + 86400000);
  const day = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}-${String(future.getDate()).padStart(2, "0")}`;
  const calendar = page.getByRole("dialog", { name: "When is blood needed?" });
  await calendar
    .getByRole("combobox", { name: "Year", exact: true })
    .selectOption(String(future.getFullYear()));
  await calendar
    .getByRole("combobox", { name: "Month", exact: true })
    .selectOption(String(future.getMonth()));
  await calendar.getByRole("button", { name: day, exact: true }).click();
  await page.getByLabel("Hour", { exact: true }).selectOption("3");
  await page.getByLabel("Minute", { exact: true }).selectOption("25");
  await page.getByLabel("AM / PM", { exact: true }).selectOption("PM");
  await expect(page.locator("input[name=requiredAt]")).toHaveValue(
    `${day}T15:25`,
  );
  await expect(page.locator("input[type=datetime-local]")).toHaveCount(0);
  await page.getByRole("checkbox", { name: /I consent to sharing/ }).check();
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
  await page.goto("/admin?section=settings");
  await page
    .getByRole("checkbox", { name: "Maintenance mode", exact: true })
    .check();
  await page.goto("/");
  await expect(
    page.getByText(
      "Maintenance is in progress. Some services are temporarily unavailable.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.goto("/admin?section=settings");
  await page
    .getByRole("checkbox", { name: "Allow new registrations", exact: true })
    .uncheck();
  await page.goto("/");
  await expect(
    page.getByText("New account registration is temporarily closed.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("/admin?section=settings");
  await page
    .getByLabel("Public support message", { exact: true })
    .fill("Scheduled service update");
  await page
    .getByRole("button", { name: "Save support message", exact: true })
    .click();
  await expect(
    page.getByText("Platform setting updated successfully.", { exact: true }),
  ).toBeVisible();
  await page.goto("/");
  await expect(
    page
      .locator("aside[role=status]")
      .getByText("Scheduled service update", { exact: true }),
  ).toBeVisible();
});

test("edit request uses the same custom date and time controls", async ({
  page,
}) => {
  const requestId = "222222222222222222222222";
  const future = new Date(Date.now() + 86400000 * 3);
  let saved: Record<string, unknown> | undefined;
  const item = {
    _id: requestId,
    owner: "test-user",
    representative: "Member",
    contact: "01712345678",
    hospital: "Hospital",
    units: 1,
    requiredAt: future.toISOString(),
    bloodGroup: "B+",
    component: "whole-blood",
    contactConsent: true,
    instructions: "",
    status: "active",
    locationId: "333333333333333333333333",
    area: "Madhupur, Tangail",
  };
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/locations"))
      return route.fulfill({
        json: {
          items: [
            {
              _id: "333333333333333333333333",
              name: "Madhupur",
              kind: "upazila",
            },
          ],
        },
      });
    if (path.endsWith("/auth/me")) return route.fulfill({ json: identity });
    if (path.endsWith("/platform"))
      return route.fulfill({ json: normalPlatform });
    if (path.endsWith(`/blood-requests/${requestId}`)) {
      if (route.request().method() === "PATCH")
        saved = route.request().postDataJSON();
      return route.fulfill({ json: { ...item, ...saved } });
    }
    return route.fulfill({ json: { items: [] } });
  });
  await page.goto(`/requests/${requestId}/edit`);
  await expect(page.locator("input[type=datetime-local]")).toHaveCount(0);
  await expect(page.getByLabel("Hour", { exact: true })).toBeEnabled();
  await page.getByLabel("Hospital", { exact: true }).fill("Example hospital");
  await page.getByLabel("Hour", { exact: true }).selectOption("12");
  await page.getByLabel("Minute", { exact: true }).selectOption("10");
  await page.getByLabel("AM / PM", { exact: true }).selectOption("AM");
  await page.getByLabel("Required by", { exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "When is blood needed?" }),
  ).toBeVisible();
  await page.screenshot({
    path: `.runtime/request-calendar-${test.info().project.name}.png`,
  });
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Save and resubmit", exact: true })
    .click();
  await expect.poll(() => saved).toBeTruthy();
  const result = new Date(String(saved?.requiredAt));
  expect(result.getHours()).toBe(0);
  expect(result.getMinutes()).toBe(10);
  expect(result.getDate()).toBe(future.getDate());
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("request form follows the selected language without bilingual labels", async ({
  page,
}) => {
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me")) return route.fulfill({ json: identity });
    if (path.endsWith("/platform"))
      return route.fulfill({ json: normalPlatform });
    return route.fulfill({ json: { items: [] } });
  });
  await page.goto("/requests/new");
  await expect(
    page.getByLabel("Representative", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("main")).not.toContainText("প্রতিনিধির নাম");
  if (test.info().project.name === "mobile") {
    await page.getByRole("button", { name: "Toggle navigation" }).click();
    await page.getByRole("button", { name: "বাংলা", exact: true }).click();
  } else {
    await page.getByRole("button", { name: "Change language", exact: true }).click();
  }
  await expect(
    page.getByLabel("প্রতিনিধির নাম", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("main")).not.toContainText("Representative");
  await expect(
    page.getByRole("button", { name: "যাচাইয়ের জন্য জমা দিন", exact: true }),
  ).toBeVisible();
  await page.getByLabel("প্রয়োজনের সময়", { exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "কখন রক্ত প্রয়োজন" }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "মাস", exact: true }),
  ).toBeVisible();
});

