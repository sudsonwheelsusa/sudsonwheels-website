import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the next occurrence of a given weekday (0=Sun … 6=Sat) as YYYY-MM-DD.
 * If today is already that weekday, returns next week's occurrence.
 */
function getNextWeekday(dayOfWeek: number): string {
  const d = new Date();
  const diff = (dayOfWeek - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

/**
 * Inject a fake window.turnstile that auto-passes before any page script runs.
 * Mirrors the pattern used in quote-form.spec.ts.
 */
async function mockTurnstile(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as Record<string, unknown>)["turnstile"] = {
      render: (_el: unknown, opts: { callback: (t: string) => void }) => {
        setTimeout(() => opts.callback("test-token"), 50);
        return "mock-id";
      },
      remove: () => {},
      reset: () => {},
      execute: () => {},
      getResponse: () => "test-token",
      isExpired: () => false,
    };
  });

  // Suppress net::ERR_FAILED from the Cloudflare script load
  await page.route("**/challenges.cloudflare.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/javascript", body: "" })
  );
}

/**
 * Log in as admin and land on the dashboard.
 * Handles the Turnstile widget and the optional MFA step.
 *
 * If the test account has TOTP MFA enrolled, set TEST_ADMIN_TOTP_CODE in the
 * environment and this helper will use it as the current 6-digit code.
 * In practice, E2E test accounts should NOT have MFA enabled so this path is
 * not exercised during automated runs.
 */
async function loginAsAdmin(page: Page) {
  await mockTurnstile(page);
  await page.goto("/portal");

  await page.locator("#login-email").fill(process.env.TEST_ADMIN_EMAIL ?? "");
  await page.locator("#login-password").fill(process.env.TEST_ADMIN_PASSWORD ?? "");

  // Wait for the mocked Turnstile callback to fire
  await page.waitForTimeout(200);

  await page.getByRole("button", { name: "Sign in" }).click();

  // If MFA is enrolled the form transitions to the TOTP step
  const mfaInput = page.locator("#mfa-code");
  const mfaVisible = await mfaInput.isVisible({ timeout: 2000 }).catch(() => false);
  if (mfaVisible) {
    // E2E test accounts should not require MFA — skip if not configured
    const totpCode = process.env.TEST_ADMIN_TOTP_CODE ?? "";
    if (!totpCode) {
      throw new Error(
        "Admin account has MFA enabled but TEST_ADMIN_TOTP_CODE is not set. " +
          "Use a test account without MFA, or provide the TOTP secret."
      );
    }
    await mfaInput.fill(totpCode);
    await page.getByRole("button", { name: "Verify" }).click();
  }

  await page.waitForURL("**/portal/dashboard");
}

/**
 * Navigate to the Calendar tab within the admin dashboard.
 * The dashboard uses client-side tab switching — click the "Calendar" nav button.
 */
async function openCalendarTab(page: Page) {
  // On desktop the nav is a sidebar; on mobile it is a top tab bar.
  // Both render buttons with accessible text "Calendar".
  await page.getByRole("button", { name: "Calendar" }).first().click();
  // Wait for the "+ New Job" button to confirm the section has rendered
  await expect(page.getByRole("button", { name: "+ New Job" })).toBeVisible();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("manual job creation", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the jobs API so tests do not write to the real database
    await page.route("/api/admin/jobs", (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, ids: ["test-job-id-1"] }),
        });
      } else {
        route.continue();
      }
    });

    // Mock the Google Calendar status check so the banner does not interfere
    await page.route("/api/admin/google/status", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ connected: false }),
      })
    );

    // Mock the Supabase jobs fetch so the calendar renders without real data
    await page.route("**/rest/v1/jobs*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      })
    );

    // Mock the Supabase services fetch so the Service dropdown has at least one option
    await page.route("**/rest/v1/services*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: "svc-1", name: "Residential Wash", sort_order: 1, is_active: true },
          { id: "svc-2", name: "Fleet Wash", sort_order: 2, is_active: true },
        ]),
      })
    );

    await loginAsAdmin(page);
    await openCalendarTab(page);
  });

  // -------------------------------------------------------------------------
  // Happy path — one-off job
  // -------------------------------------------------------------------------

  test("can open CreateJobSheet and submit a one-off job", async ({ page }) => {
    await page.getByRole("button", { name: "+ New Job" }).click();

    // Sheet should slide in
    await expect(page.getByRole("heading", { name: "New Job" })).toBeVisible();

    // Fill required fields
    await page.locator("#title").fill("Test One-Off Job");
    await page.locator("#customer_name").fill("Test Customer");

    // Service dropdown — shadcn Select; open then choose first item
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Residential Wash" }).click();

    // Date and start time
    const today = new Date().toISOString().split("T")[0];
    await page.locator("#date").fill(today);
    await page.locator("#start_time").fill("09:00");

    // Recurrence should default to "Does not repeat" — no change needed

    await page.getByRole("button", { name: "Create Job" }).click();

    // Sheet should close on success (heading disappears)
    await expect(page.getByRole("heading", { name: "New Job" })).not.toBeVisible({
      timeout: 5000,
    });
  });

  // -------------------------------------------------------------------------
  // Error case — submit without required fields
  // -------------------------------------------------------------------------

  test("shows validation errors when required fields are empty", async ({ page }) => {
    await page.getByRole("button", { name: "+ New Job" }).click();

    await expect(page.getByRole("heading", { name: "New Job" })).toBeVisible();

    // Click submit without filling anything
    await page.getByRole("button", { name: "Create Job" }).click();

    // Zod / react-hook-form should surface inline "Required" messages
    const requiredErrors = page.getByText("Required");
    await expect(requiredErrors.first()).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Happy path — recurring weekly series
  // -------------------------------------------------------------------------

  test("can create a recurring weekly series with day-of-week buttons", async ({ page }) => {
    await page.getByRole("button", { name: "+ New Job" }).click();

    await expect(page.getByRole("heading", { name: "New Job" })).toBeVisible();

    // Fill required fields
    await page.locator("#title").fill("Valley Transportation Fleet Wash");
    await page.locator("#customer_name").fill("Valley Transportation");

    // Service dropdown
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Fleet Wash" }).click();

    // Pick the next Saturday as the start date
    const nextSat = getNextWeekday(6);
    await page.locator("#date").fill(nextSat);
    await page.locator("#start_time").fill("08:00");
    await page.locator("#end_time").fill("12:00");

    // Open the Repeat dropdown (second combobox in the form — inside the Recurrence section)
    await page.getByRole("combobox").last().click();
    await page.getByRole("option", { name: "Weekly" }).click();

    // Day-of-week buttons should now be visible
    await expect(page.getByRole("button", { name: "Sa" })).toBeVisible();

    // Select Saturday and Sunday
    await page.getByRole("button", { name: "Sa" }).click();
    await page.getByRole("button", { name: "Su" }).click();

    await page.getByRole("button", { name: "Create Job" }).click();

    // Sheet closes — mock returns 200 so it should succeed
    await expect(page.getByRole("heading", { name: "New Job" })).not.toBeVisible({
      timeout: 8000,
    });
  });

  // -------------------------------------------------------------------------
  // Happy path — can cancel without submitting
  // -------------------------------------------------------------------------

  test("can cancel the sheet without creating a job", async ({ page }) => {
    await page.getByRole("button", { name: "+ New Job" }).click();

    await expect(page.getByRole("heading", { name: "New Job" })).toBeVisible();

    await page.locator("#title").fill("Should Not Be Created");

    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByRole("heading", { name: "New Job" })).not.toBeVisible({
      timeout: 3000,
    });
  });
});
