import { test, expect } from "@playwright/test";
const mine = "222222222222222222222222",
  assigned = "333333333333333333333333";
for (const en of [true, false])
  test(`volunteer dashboard completes clear work tabs and private feedback in ${en ? "English" : "Bangla"}`, async ({
    page,
  }, info) => {
    await page.addInitScript(
      (en) =>
        localStorage.setItem(
          "madhublood-preferences",
          JSON.stringify({ state: { en, dark: true }, version: 0 }),
        ),
      en,
    );
    let feedback: Record<string, unknown> | undefined;
    const record = {
      _id: mine,
      hospital: "Madhupur Community Hospital",
      bloodGroup: "B+",
      area: "Madhupur, Tangail",
      units: 2,
      status: "active",
      requiredAt: "2027-10-20T10:00:00Z",
    };
    await page.route("**/api/v1/**", (route) => {
      const url = new URL(route.request().url()),
        path = url.pathname;
      if (path.endsWith("/auth/me"))
        return route.fulfill({
          json: {
            csrf: "fixture",
            user: {
              id: "111111111111111111111111",
              name: "Nusrat",
              roles: ["user", "volunteer"],
              volunteerPermissions: ["submit-referrals", "coordinate-requests"],
              emailVerified: true,
              profileCompleted: true,
            },
          },
        });
      if (path.endsWith("/family-feedback")) {
        feedback = route.request().postDataJSON();
        return route.fulfill({ json: { ok: true } });
      }
      if (path.endsWith("/admin/volunteer-dashboard")) {
        const view = url.searchParams.get("view"),
          status = url.searchParams.get("status");
        return route.fulfill({
          json: {
            stats: {
              created: 12,
              pending: 3,
              open: 4,
              completed: 5,
              assignedOpen: 2,
              callbacks: 1,
              requestedUnits: 24,
              familyReportedUnits: feedback ? 4 : 2,
            },
            canSubmit: true,
            canManage: true,
            page: 1,
            total: 1,
            items:
              view === "tasks"
                ? [
                    {
                      id: "task1",
                      requestId: assigned,
                      donorId: "444444444444444444444444",
                      name: "Rahim",
                      hospital: record.hospital,
                      bloodGroup: "B+",
                      nextContactAt: "2026-10-17T05:00:00Z",
                      outcome: "will-confirm",
                    },
                  ]
                : view === "history"
                  ? [
                      {
                        id: "event1",
                        requestId: mine,
                        action: "coordination.family-feedback",
                        hospital: record.hospital,
                        bloodGroup: "B+",
                        createdAt: "2026-10-17T05:00:00Z",
                      },
                    ]
                  : [
                      {
                        ...record,
                        _id: view === "assignments" ? assigned : mine,
                        status: status === "pending" ? "submitted" : "active",
                        familyFeedback: feedback,
                      },
                    ],
          },
        });
      }
      if (path.endsWith(`/coordination/${assigned}`))
        return route.fulfill({
          json: {
            request: {
              ...record,
              id: assigned,
              contact: "01712345678",
              representative: "Family representative",
            },
            summary: { required: 2, arranged: 1, arrived: 0, remaining: 1 },
            coordinator: { id: "111111111111111111111111", name: "Nusrat" },
            canAssign: false,
            canUpdate: true,
            confirmed: false,
            candidates: [],
            donors: [
              {
                id: "444444444444444444444444",
                name: "Rahim",
                phone: "01712345679",
                outcome: "will-confirm",
                note: "",
                nextContactAt: null,
              },
            ],
          },
        });
      return route.fulfill({
        json: {
          items: [],
          total: 0,
          maintenance: false,
          registrationOpen: true,
        },
      });
    });
    await page.goto("/volunteer");
    await expect(
      page.getByRole("heading", {
        name: en ? "Volunteer dashboard" : "স্বেচ্ছাসেবকের ড্যাশবোর্ড",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.locator(".volunteer-metrics > button")).toHaveCount(5);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `.runtime/volunteer-dashboard-${en ? "en" : "bn"}-${info.project.name}.png`,
      fullPage: true,
    });
    await page
      .locator(".volunteer-card-actions")
      .getByRole("button", {
        name: en ? "Family feedback" : "পরিবারের মতামত",
        exact: true,
      })
      .click();
    await page
      .getByLabel(en ? "What did the family say?" : "কী জানা গেল?", {
        exact: true,
      })
      .selectOption("received");
    await page
      .getByLabel(en ? "How many units were received?" : "কত ব্যাগ পেয়েছেন?", {
        exact: true,
      })
      .fill("2");
    await page
      .getByLabel(en ? "Private note (optional)" : "ব্যক্তিগত নোট (ঐচ্ছিক)", {
        exact: true,
      })
      .fill("Family confirmed by phone");
    await page
      .getByRole("button", {
        name: en ? "Save feedback" : "মতামত সংরক্ষণ",
        exact: true,
      })
      .click();
    await expect.poll(() => feedback?.receivedUnits).toBe(2);
    expect(feedback?.note).toBe("Family confirmed by phone");
    await page
      .getByRole("button", { name: en ? "Requests" : "অনুরোধ", exact: true })
      .click();
    await page
      .getByLabel(en ? "Filter request status" : "অনুরোধের অবস্থা", {
        exact: true,
      })
      .selectOption("pending");
    await expect(page.locator(".volunteer-request-card .badge")).toHaveText(
      en ? "Submitted" : "জমা হয়েছে",
    );
    await page
      .getByRole("button", {
        name: en ? "Assigned to me" : "আমার দায়িত্বে",
        exact: true,
      })
      .click();
    await page
      .getByRole("button", {
        name: en ? "Follow up" : "যোগাযোগ ও অগ্রগতি",
        exact: true,
      })
      .click();
    await expect(page.getByRole("link", { name: /01712345679/ })).toBeVisible();
    await expect(page.getByLabel("Assigned coordinator")).toHaveCount(0);
    await page
      .getByRole("button", {
        name: en ? "Today’s tasks" : "আজকের কাজ",
        exact: true,
      })
      .click();
    await expect(page.locator(".volunteer-task-list")).toContainText("Rahim");
    await page
      .getByRole("button", {
        name: en ? "Update" : "আপডেট ও কাজ",
        exact: true,
      })
      .click();
    await expect(page.locator(".volunteer-selected")).toBeInViewport();
    await page
      .getByRole("button", { name: en ? "History" : "ইতিহাস", exact: true })
      .click();
    await expect(page.locator(".volunteer-history")).toContainText(
      en ? "Family feedback saved" : "পরিবারের মতামত রেখেছেন",
    );
    await expect(page.locator(".volunteer-history")).not.toContainText(
      "Family confirmed by phone",
    );
  });
