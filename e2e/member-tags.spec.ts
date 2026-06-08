import { test, expect } from "@playwright/test";

test.describe("member tags — alumni approval", () => {
  test("member requests alumni; exec approves; roster shows Alumni chip", async ({
    page,
  }) => {
    // One-shot clear + reload so TagsProvider hydrates from empty assignments (then backfills).
    await page.goto("/login");
    await page.evaluate(() => {
      localStorage.removeItem("cams.tags.v1");
      localStorage.removeItem("cams.tagAssignments.v1");
    });
    await page.reload();

    // --- Member (Jordan Hayes): request alumni tag ---
    await page.getByLabel(/Crimson Email/i).fill("jhayes@crimson.ua.edu");
    await page.getByLabel(/^Class Password$/i).fill("cams2026");
    await page.getByRole("button", { name: /^Sign In$/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/dashboard/profile");
    await expect(page.getByRole("heading", { name: /^Tags$/ })).toBeVisible();

    await page.getByRole("button", { name: /Add tag/i }).click();
    const dialog = page.getByRole("dialog");

    await dialog.getByRole("combobox").nth(0).click();
    await page.getByRole("option", { name: /^Alumni$/ }).first().click();

    await dialog.getByRole("combobox").nth(1).click();
    await page.getByRole("option", { name: /^Alumni$/ }).click();

    await dialog.getByPlaceholder(/Where do you work/i).fill(
      "Graduated 2027; analyst at regional IB — requesting alumni verification.",
    );
    await dialog.getByRole("button", { name: /^Request$/i }).click();

    await expect(dialog).not.toBeVisible();
    await expect(page.getByText(/Pending exec approval/i)).toBeVisible();

    // --- Exec: approve queue ---
    await page.locator('button[title="Log out"]').click();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel(/Crimson Email/i).fill("dkwhitfield@crimson.ua.edu");
    await page.getByLabel(/^Class Password$/i).fill("cams2026");
    await page.getByRole("button", { name: /^Sign In$/i }).click();

    await page.goto("/dashboard/exec");
    await page.getByRole("tab", { name: /Alumni.*tag approvals/i }).click();

    await expect(page.getByText(/Jordan Hayes/i)).toBeVisible();
    await page.getByRole("button", { name: /^Approve$/i }).first().click();

    // --- Public roster: approved Alumni chip for Jordan ---
    await page.goto("/roster");
    const jordanCard = page
      .locator(".rounded-lg.border.bg-white")
      .filter({ hasText: "Jordan Hayes" });
    await expect(jordanCard.getByText("Alumni", { exact: true })).toBeVisible();
  });
});
