import { test, expect, type Page } from "@playwright/test";
import { readAccounts } from "./support/accounts";

test("requester, moderator and donor coordinate through the real UI", async ({
  browser,
}) => {
  test.setTimeout(60000);
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
    await page.goto("/login");
    await page.getByRole("button", { name: "Change language" }).click();
    await page
      .getByLabel("Email address", { exact: true })
      .fill(users[index].email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator(".dashboard-tabs")).toBeVisible();
  }
  let requestId = "";
  try {
    const [owner, donor, moderator] = pages;
    await login(donor, 1);
    await donor.getByRole("button", { name: "profile", exact: true }).click();
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
    await owner.getByLabel(/Mobile/).fill(users[0].phone!);
    await owner.getByLabel(/Blood group/).selectOption("O+");
    await owner.getByLabel(/Hospital/).fill("Browser Hospital " + suffix);
    await owner
      .getByLabel(/Required by/)
      .fill(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
    await owner.getByLabel("I consent to sharing").check();
    await owner.getByRole("button", { name: /Submit/ }).click();
    await expect(owner).toHaveURL(/requests\/[a-f0-9]{24}/);
    requestId = owner.url().split("/").pop()!;
    await login(moderator, 2);
    await moderator.goto("/admin");
    const row = moderator
      .locator(".list-row")
      .filter({ hasText: "Browser Hospital " + suffix });
    await row
      .getByRole("button", { name: "verification", exact: true })
      .click();
    await row.getByRole("button", { name: "active", exact: true }).click();
    await expect(row).toHaveCount(0);
    await donor.bringToFront();
    await donor.goto("/requests/" + requestId);
    await donor.getByRole("button", { name: /Accept/ }).click();
    await expect(
      donor.getByText(users[0].phone!, { exact: false }),
    ).toBeVisible();
    await owner.bringToFront();
    await owner.reload();
    await expect(
      owner.getByText(users[1].phone!, { exact: false }),
    ).toBeVisible();
    owner.on("dialog", (d) => d.accept());
    await owner.getByRole("button", { name: "arranged", exact: true }).click();
    await expect(owner.locator(".panel>.badge")).toHaveText("arranged");
    await owner.getByRole("button", { name: "completed", exact: true }).click();
    await expect(owner.locator(".panel>.badge")).toHaveText("completed");
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
  }
});
