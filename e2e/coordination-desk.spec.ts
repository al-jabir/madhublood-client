import { test, expect } from "@playwright/test";
const requestId = "222222222222222222222222";
const coordinatorId = "333333333333333333333333";
test("administrator assigns, follows up and completes a requester-confirmed request", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "madhublood-preferences",
      JSON.stringify({ state: { en: true, dark: true }, version: 0 }),
    ),
  );
  let assigned = false,
    arranged = false,
    status = "active",
    confirmed = false;
  const mutations: string[] = [];
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me"))
      return route.fulfill({
        json: {
          csrf: "test",
          user: {
            id: "111111111111111111111111",
            name: "Demo administrator",
            roles: ["super-admin"],
            profileCompleted: true,
            emailVerified: true,
          },
        },
      });
    if (route.request().method() !== "GET") {
      mutations.push(path);
      if (path.endsWith("/coordinator")) assigned = true;
      if (path.endsWith("/contact")) arranged = true;
      if (path.endsWith("/ready")) {
        status = "arranged";
        confirmed = true;
      }
      if (path.endsWith("/complete")) status = "completed";
      return route.fulfill({ json: { ok: true } });
    }
    const summary = {
      required: 2,
      arranged: arranged ? 2 : 1,
      arrived: 0,
      remaining: arranged ? 0 : 1,
    };
    const coordinator = assigned
      ? { id: coordinatorId, name: "Nusrat Jahan" }
      : null;
    const request = {
      id: requestId,
      hospital: "Madhupur General Hospital",
      bloodGroup: "A+",
      area: "Madhupur, Tangail",
      requiredAt: "2027-12-20T12:00:00.000Z",
      status,
      representative: "Patient representative",
      contact: "01700000001",
    };
    if (path.endsWith("/admin/coordination"))
      return route.fulfill({
        json: {
          items:
            status === "completed"
              ? []
              : [{ ...request, summary, coordinator, confirmed }],
          total: status === "completed" ? 0 : 1,
          page: 1,
          canAssign: true,
        },
      });
    if (path.endsWith(`/coordination/${requestId}`))
      return route.fulfill({
        json: {
          request,
          summary,
          coordinator,
          confirmed,
          canAssign: true,
          canUpdate: true,
          candidates: [{ id: coordinatorId, name: "Nusrat Jahan" }],
          donors: [
            {
              id: "444444444444444444444444",
              name: "Farhan Ahmed",
              phone: "01700000002",
              outcome: arranged ? "arranged" : "contacted",
              note: "",
              nextContactAt: null,
            },
            {
              id: "555555555555555555555555",
              name: "Sadia Rahman",
              phone: "01700000003",
              outcome: "arranged",
              note: "Can arrive this afternoon",
              nextContactAt: null,
            },
          ],
        },
      });
    return route.fulfill({ json: { items: [], total: 0 } });
  });
  await page.goto("/admin?section=coordination");
  await expect(
    page.getByRole("heading", { name: "Coordinate care, together" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Mark arranged", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Assigned coordinator").selectOption(coordinatorId);
  await page
    .getByRole("button", { name: "Save assignment", exact: true })
    .click();
  await expect(page.getByLabel("Assigned coordinator")).toHaveValue(
    coordinatorId,
  );
  const contact = page.locator(".coord-donor").first();
  await contact.getByLabel("Contact outcome").selectOption("arranged");
  await contact.getByLabel("Private team note").fill("Confirmed by phone");
  await contact.getByRole("button", { name: "Save update" }).click();
  await expect(
    page.getByRole("button", { name: "Mark arranged", exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(page.locator("[data-sonner-toast]")).toHaveCount(0, {
    timeout: 10000,
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `.runtime/coordination-desk-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.screenshot({
    path: `.runtime/coordination-preview-${test.info().project.name}.png`,
  });
  await page
    .getByRole("button", { name: "Mark arranged", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Complete request", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Complete request", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "No open assignments" }),
  ).toBeVisible();
  expect(mutations).toContain(
    `/api/v1/admin/coordination/${requestId}/complete`,
  );
});
test("coordinator sees only the coordination workspace and no assignment controls", async ({
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
      return route.fulfill({
        json: {
          csrf: "test",
          user: {
            id: coordinatorId,
            name: "Coordinator",
            roles: ["volunteer"],
            volunteerPermissions: ["coordinate-requests"],
            profileCompleted: true,
            emailVerified: true,
          },
        },
      });
    if (path.endsWith("/admin/volunteer-dashboard"))
      return route.fulfill({
        json: {
          stats: {
            created: 0,
            pending: 0,
            open: 0,
            completed: 0,
            assignedOpen: 0,
            callbacks: 0,
            requestedUnits: 0,
            familyReportedUnits: 0,
          },
          items: [],
          total: 0,
          page: 1,
          canManage: true,
          canSubmit: false,
        },
      });
    return route.fulfill({
      json: { items: [], total: 0, page: 1, canAssign: false },
    });
  });
  await page.goto("/admin?section=users");
  await expect(page.locator(".admin-role")).toHaveText("Coordinator");
  await expect(
    page.getByRole("heading", { name: "Volunteer dashboard" }),
  ).toBeVisible();
  if ((page.viewportSize()?.width ?? 1200) <= 900)
    await page.getByRole("button", { name: "Toggle admin navigation" }).click();
  const navigation = page.getByRole("navigation", { name: "Admin navigation" });
  await expect(navigation.getByRole("link")).toHaveCount(1);
  await expect(page.getByLabel("Assigned coordinator")).toHaveCount(0);
});

test("request owner confirms progress without seeing private team notes", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "madhublood-preferences",
      JSON.stringify({ state: { en: true, dark: false }, version: 0 }),
    ),
  );
  let confirmed = false;
  page.on("dialog", (dialog) => dialog.accept());
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me"))
      return route.fulfill({
        json: {
          csrf: "test",
          user: {
            id: coordinatorId,
            name: "Requester",
            roles: ["user"],
            profileCompleted: true,
            emailVerified: true,
          },
        },
      });
    if (path.endsWith("/confirm-fulfillment")) {
      confirmed = true;
      return route.fulfill({ json: { ok: true } });
    }
    if (path.endsWith("/coordination-progress"))
      return route.fulfill({
        json: {
          managed: true,
          confirmed,
          coordinator: { name: "Nusrat Jahan" },
          summary: { required: 1, arranged: 1, arrived: 0, remaining: 0 },
        },
      });
    if (path.endsWith(`/blood-requests/${requestId}`))
      return route.fulfill({
        json: {
          id: requestId,
          owner: coordinatorId,
          coordinatorManaged: true,
          hospital: "Test hospital",
          area: "Madhupur, Tangail",
          bloodGroup: "A+",
          component: "whole-blood",
          units: 1,
          requiredAt: "2027-12-20T12:00:00Z",
          status: "arranged",
        },
      });
    return route.fulfill({
      json: { items: [], total: 0, maintenance: false, registrationOpen: true },
    });
  });
  await page.goto(`/requests/${requestId}`);
  await expect(
    page.getByRole("heading", { name: "Your request progress" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Completed", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Private team note")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Confirm arrangement received", exact: true })
    .click();
  await expect(
    page.getByText(
      "You confirmed the arrangement. An administrator will close the request.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Confirm arrangement received",
      exact: true,
    }),
  ).toHaveCount(0);
});

test("coordinator approval preserves a complete area name containing a comma", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "madhublood-preferences",
      JSON.stringify({ state: { en: true, dark: true }, version: 0 }),
    ),
  );
  let saved: unknown;
  let attempts = 0;
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me"))
      return route.fulfill({
        json: {
          csrf: "test",
          user: {
            id: "111111111111111111111111",
            name: "Admin",
            roles: ["super-admin"],
            profileCompleted: true,
            emailVerified: true,
          },
        },
      });
    if (route.request().method() !== "GET") {
      attempts++;
      if (attempts === 1)
        return route.fulfill({
          status: 500,
          json: { message: "Temporary failure" },
        });
      saved = route.request().postDataJSON();
      return route.fulfill({ json: { ok: true } });
    }
    if (path.endsWith("/locations"))
      return route.fulfill({
        json: {
          items: [
            {
              _id: "777777777777777777777777",
              name: "Tangail",
              kind: "district",
            },
            {
              _id: "888888888888888888888888",
              name: "Madhupur",
              kind: "upazila",
              parent: "777777777777777777777777",
            },
          ],
        },
      });
    if (path.endsWith("/super-admin/users"))
      return route.fulfill({
        json: {
          items: [
            {
              _id: coordinatorId,
              name: "Nusrat",
              email: "nusrat@example.test",
              roles: ["user"],
              areas: ["Madhupur, Tangail"],
              profileCompleted: true,
            },
            {
              _id: "666666666666666666666666",
              name: "MadhuBlood Admin",
              email: "admin@example.test",
              roles: ["user", "super-admin"],
              areas: ["Madhupur, Tangail"],
              profileCompleted: true,
            },
          ],
          total: 2,
        },
      });
    return route.fulfill({ json: { items: [], total: 0 } });
  });
  await page.goto("/admin?section=users");
  const card = page.locator(".user-access-card").first();
  await expect(page.locator(".user-access-card")).toHaveCount(2);
  await expect(card.locator("details")).not.toHaveAttribute("open", "");
  expect((await card.boundingBox())!.height).toBeLessThan(300);
  await page.screenshot({
    path: `.runtime/users-compact-${test.info().project.name}.png`,
    fullPage: true,
  });
  await card.getByText("Manage access", { exact: true }).click();
  await card
    .getByRole("combobox", { name: "Role", exact: true })
    .selectOption("volunteer");
  await expect(
    card.getByLabel("Assigned service areas", { exact: true }),
  ).toHaveValues(["888888888888888888888888"]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `.runtime/users-edit-${test.info().project.name}.png`,
    fullPage: true,
  });
  await expect(
    card.getByRole("checkbox", { name: /Submit requests for others/ }),
  ).not.toBeChecked();
  await expect(
    card.getByRole("checkbox", { name: /Manage assigned requests/ }),
  ).not.toBeChecked();
  await card
    .getByRole("checkbox", { name: /Submit requests for others/ })
    .check();
  const saveButton = card.getByRole("button", {
    name: "Save role",
    exact: true,
  });
  await saveButton.click();
  const modal = page.getByRole("dialog", { name: "Confirm access changes" });
  await expect(modal).toBeVisible();
  await expect(modal.getByText("Nusrat", { exact: true })).toBeVisible();
  await expect(
    modal.getByRole("button", { name: "Go back", exact: true }),
  ).toBeFocused();
  expect(saved).toBeUndefined();
  await page.keyboard.press("Escape");
  await expect(modal).toHaveCount(0);
  await expect(saveButton).toBeFocused();
  expect(saved).toBeUndefined();
  await saveButton.click();
  await modal.getByRole("button", { name: "Go back", exact: true }).click();
  await expect(modal).toHaveCount(0);
  expect(saved).toBeUndefined();
  await saveButton.click();
  await modal.screenshot({
    path: `.runtime/access-confirmation-${test.info().project.name}.png`,
  });
  await modal
    .getByRole("button", { name: "Confirm & save", exact: true })
    .click();
  await expect(modal.getByRole("alert")).toHaveText(
    "Changes could not be saved. Please try again.",
  );
  await expect(modal).toBeVisible();
  expect(saved).toBeUndefined();
  await modal
    .getByRole("button", { name: "Confirm & save", exact: true })
    .click();
  await expect(modal).toHaveCount(0);
  await expect
    .poll(() => saved)
    .toEqual({
      roles: ["user", "volunteer"],
      areas: ["Madhupur, Tangail"],
      volunteerPermissions: ["submit-referrals"],
      locationIds: ["888888888888888888888888"],
    });
});
