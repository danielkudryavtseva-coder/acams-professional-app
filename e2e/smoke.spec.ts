import { test, expect } from "@playwright/test";

/** Minimal valid `cams_user` payload (matches `Member` / `MOCK_MEMBERS[0]`). */
const SEEDED_USER = {
  id: "m1",
  firstName: "Drew",
  lastName: "Whitfield",
  email: "dkwhitfield@crimson.ua.edu",
  phone: "205-555-0101",
  classYear: "Junior",
  graduationYear: 2027,
  committee: "Investment",
  interests: ["IB", "PE"],
  personalStatement: "Test",
  resumeFilename: "whitfield_resume.pdf",
  linkedin: "linkedin.com/in/drewwhitfield",
  role: "exec",
  gpa: "3.91",
  pnlTagged: false,
  cohort: "Spring 2026",
  joinedAt: "2025-01-15",
  pipelineActivityCount: 12,
  pitchesSubmitted: 3,
  coffeeChatsCompleted: 5,
};

test.describe("app smoke", () => {
  test("landing loads with no runtime errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await expect(page).toHaveTitle(/CAMS/i);
    await expect(page.locator("body")).toBeVisible();
    expect(errors, `page errors: ${errors.join("; ")}`).toEqual([]);
  });

  test("dashboard connect loads graph after auth seed", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await page.addInitScript((user) => {
      localStorage.setItem("cams_user", JSON.stringify(user));
    }, SEEDED_USER);

    await page.goto("/dashboard/connect");
    await expect(page.getByRole("heading", { name: "Connect" })).toBeVisible();
    await expect(page.getByText("Alumni network")).toBeVisible();

    const canvas = page.locator(".force-graph-container canvas").first();
    await expect(canvas).toBeVisible({ timeout: 15_000 });

    // Canvas must actually have non-zero pixel dimensions (otherwise the panel
    // looks "blank dark" even though the element is mounted).
    await expect
      .poll(
        async () =>
          canvas.evaluate((el) => {
            const c = el as HTMLCanvasElement;
            return { w: c.width, h: c.height };
          }),
        { timeout: 10_000 },
      )
      .toMatchObject({ w: expect.any(Number), h: expect.any(Number) });

    const dims = await canvas.evaluate((el) => {
      const c = el as HTMLCanvasElement;
      return { w: c.width, h: c.height };
    });
    expect(dims.w).toBeGreaterThan(0);
    expect(dims.h).toBeGreaterThan(0);

    expect(errors, `page errors: ${errors.join("; ")}`).toEqual([]);
  });
});
