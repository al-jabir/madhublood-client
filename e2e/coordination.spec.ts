import { test, expect, type Page } from "@playwright/test";
import { readAccounts } from "./support/accounts";

test("requester, moderator and donor coordinate through the real UI", async ({
  browser,
}) => {
  test.setTimeout(120000);
  test.skip(
    !process.env.E2E_ACCOUNTS_FILE,
    "Set E2E_ACCOUNTS_FILE for the backend-provisioned workflow test.",
  );
  const { users, password } = readAccounts();
  const suffix = String(Date.now()).slice(-8);
  const contexts = await Promise.all(
    [0, 1, 2].map(() =>
      browser.newContext({
        baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:5173",
        viewport:
          test.info().project.name === "mobile"
            ? { width: 390, height: 844 }
            : { width: 1280, height: 900 },
        isMobile: test.info().project.name === "mobile",
        hasTouch: test.info().project.name === "mobile",
      }),
    ),
  );
  const pages = await Promise.all(contexts.map((c) => c.newPage()));
  for (const page of pages) page.setDefaultTimeout(10000);
  async function login(page: Page, index: number) {
    await page.bringToFront();
    await page.addInitScript(() =>
      localStorage.setItem(
        "madhublood-preferences",
        JSON.stringify({ state: { en: true, dark: false }, version: 0 }),
      ),
    );
    await page.goto("/login");
    await page
      .getByLabel("Email address", { exact: true })
      .fill(users[index].email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(index === 2 ? /admin/ : /dashboard/);
  }
  let requestId = "";
  try {
    const [owner, donor, moderator] = pages;
    await login(donor, 1);
    await donor.goto("/dashboard?tab=donor");
    await donor.getByLabel("Blood group", { exact: true }).selectOption("O+");
    for (const label of [
      "I am available",
      "Show my name",
      "Share my phone",
      "Receive in-app",
    ])
      await donor.getByLabel(new RegExp(label)).check();
    await donor.getByRole("button", { name: "Save profile & consent" }).click();
    await expect(
      donor.getByText("Profile saved", { exact: true }),
    ).toBeVisible();
    await login(owner, 0);
    await owner.goto("/requests/new");
    await owner.getByLabel(/Representative/).fill("Browser Representative");
    await owner.getByLabel(/Mobile/).fill(users[0].phone!.replace(/^\+88/, ""));
    await owner.getByLabel(/Blood group/).selectOption("O+");
    await owner.getByLabel(/Hospital/).fill("Browser Hospital " + suffix);
    await owner.getByLabel("Required by", { exact: true }).click();
    const future = new Date(Date.now() + 86400000);
    const date = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}-${String(future.getDate()).padStart(2, "0")}`;
    const calendar = owner.getByRole("dialog", {
      name: "When is blood needed?",
    });
    await calendar
      .getByRole("combobox", { name: "Year", exact: true })
      .selectOption(String(future.getFullYear()));
    await calendar
      .getByRole("combobox", { name: "Month", exact: true })
      .selectOption(String(future.getMonth()));
    await calendar.getByRole("button", { name: date, exact: true }).click();
    await owner.getByLabel(/I consent to sharing/).check();
    await owner.getByRole("button", { name: /Submit/ }).click();
    await expect(owner).toHaveURL(/requests\/[a-f0-9]{24}/);
    requestId = owner.url().split("/").pop()!;
    await login(moderator, 2);
    await moderator.goto("/admin?section=requests");
    const row = moderator
      .locator("tbody tr")
      .filter({ hasText: "Browser Hospital " + suffix });
    await row
      .getByRole("button", { name: "Start review", exact: true })
      .click();
    await row.getByRole("button", { name: "Approve", exact: true }).click();
    await expect(row).toHaveCount(0);
    await donor.bringToFront();
    await donor.goto("/requests/" + requestId);
    await donor
      .getByRole("button", { name: "I want to donate", exact: true })
      .click();
    await expect(
      donor.getByText(users[0].phone!, { exact: false }),
    ).toBeVisible();
    await owner.bringToFront();
    await owner.reload();
    await expect(
      owner.getByText(users[1].phone!, { exact: false }),
    ).toBeVisible();
    owner.on("dialog", (d) => d.accept());
    await owner.getByRole("button", { name: "Arranged", exact: true }).click();
    await expect(owner.locator(".panel>.badge")).toHaveText("Arranged");
    await owner.getByRole("button", { name: "Completed", exact: true }).click();
    await expect(owner.locator(".panel>.badge")).toHaveText("Completed");
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
  }
});
