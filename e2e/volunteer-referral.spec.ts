import { test, expect } from "@playwright/test";
for (const staff of [true, false])
  test(
    staff
      ? "volunteer submits a private-source family request"
      : "member does not see volunteer submission controls",
    async ({ page }, info) => {
      await page.addInitScript(() =>
        localStorage.setItem(
          "madhublood-preferences",
          JSON.stringify({ state: { en: true, dark: true }, version: 0 }),
        ),
      );
      let submitted: Record<string, unknown> | undefined;
      await page.route("**/api/v1/**", async (route) => {
        const path = new URL(route.request().url()).pathname;
        if (path.endsWith("/auth/me"))
          return route.fulfill({
            json: {
              csrf: "fixture",
              user: {
                id: "111111111111111111111111",
                name: "Volunteer",
                roles: [staff ? "volunteer" : "member"],
                volunteerPermissions: staff ? ["submit-referrals"] : [],
                profileCompleted: true,
                emailVerified: true,
              },
            },
          });
        if (path.endsWith("/locations"))
          return route.fulfill({
            json: {
              items: [
                {
                  _id: "222222222222222222222222",
                  name: "Tangail",
                  kind: "district",
                },
                {
                  _id: "333333333333333333333333",
                  name: "Madhupur",
                  kind: "upazila",
                  parent: "222222222222222222222222",
                },
              ],
            },
          });
        if (
          path.endsWith("/blood-requests") &&
          route.request().method() === "POST"
        ) {
          submitted = route.request().postDataJSON();
          return route.fulfill({
            status: 201,
            json: { _id: "444444444444444444444444" },
          });
        }
        if (path.endsWith("/blood-requests/444444444444444444444444"))
          return route.fulfill({
            json: {
              id: "444444444444444444444444",
              bloodGroup: "O+",
              hospital: "Madhupur Hospital",
              area: "Madhupur, Tangail",
              requiredAt: "2027-12-20T12:00:00Z",
              component: "whole-blood",
              units: 1,
              status: "submitted",
              submittedOnBehalf: true,
            },
          });
        if (path.endsWith("/platform"))
          return route.fulfill({
            json: { maintenanceMode: false, allowRegistrations: true },
          });
        return route.fulfill({ json: { items: [], total: 0 } });
      });
      await page.goto("/requests/new");
      const toggle = page.getByLabel("Submit on behalf of someone else");
      if (!staff) {
        await expect(
          page.getByRole("heading", {
            name: "Request submission is restricted",
          }),
        ).toBeVisible();
        await expect(toggle).toHaveCount(0);
        return;
      }
      await page
        .getByLabel("Review or paste the post text")
        .fill(
          "O+ রক্ত প্রয়োজন আজ\nরোগীর সমস্যা: সিজার\nপরিমাণ: একব্যাগ\nস্থান: Madhupur Hospital\n01712345678",
        );
      await expect(
        page.getByRole("button", { name: "Apply draft to form" }),
      ).toBeDisabled();
      await page.getByLabel("I reviewed the extracted fields").check();
      await page.getByRole("button", { name: "Apply draft to form" }).click();
      await expect(toggle).toBeChecked();
      await expect(page.locator('[name="patientReason"]')).toHaveValue("সিজার");
      await expect(page.locator('[name="contact"]')).toHaveValue("01712345678");
      await expect(page.locator('[name="contactConsent"]')).not.toBeChecked();
      await page.locator('[name="representativeRelationship"]').fill("Brother");
      await toggle.check();
      await expect(
        page.getByRole("heading", { name: "No family account needed" }),
      ).toBeVisible();
      await page
        .getByLabel("Source", { exact: true })
        .selectOption("social-media");
      await page
        .getByLabel("Original post link (optional)")
        .fill("https://example.test/news");
      await page.getByLabel("I confirmed the current need by phone").check();
      await page
        .getByLabel(
          "The representative permitted this request and contact sharing with responding donors",
        )
        .check();
      await page
        .getByLabel("Representative", { exact: true })
        .fill("Family contact");
      await page.getByLabel("Mobile", { exact: true }).fill("01712345678");
      await page
        .getByLabel("Hospital", { exact: true })
        .fill("Madhupur Hospital");
      await page
        .getByRole("button", { name: "Required by", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Next month", exact: true })
        .click();
      const next = new Date();
      next.setMonth(next.getMonth() + 1, 15);
      const date = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-15`;
      await page.getByRole("button", { name: date, exact: true }).click();
      await page
        .getByLabel(
          "The representative allows sharing this contact with donors who accept.",
          { exact: true },
        )
        .check();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `.runtime/volunteer-referral-${info.project.name}.png`,
        fullPage: true,
      });
      await page
        .getByRole("button", { name: "Submit for review", exact: true })
        .click();
      await expect(page).toHaveURL(/requests\/444444/);
      expect(submitted?.patientReason).toBe("সিজার");
      expect(submitted?.representativeRelationship).toBe("Brother");
      expect(submitted?.referral).toEqual({
        source: "social-media",
        sourceUrl: "https://example.test/news",
        verifiedByPhone: true,
        representativeConsent: true,
      });
      await expect(
        page.getByText("Submitted by a volunteer on behalf of the family.", {
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Original post", exact: true }),
      ).toHaveCount(0);
    },
  );
