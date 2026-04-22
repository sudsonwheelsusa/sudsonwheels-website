import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Collect all non-trivial browser console errors during a test.
 * "Non-trivial" excludes the expected React hydration noise and Turnstile
 * third-party script warnings that are outside our control.
 */
function collectConsoleErrors(page: Page): () => string[] {
  const errors: string[] = [];
  const IGNORED = [
    // React DevTools
    "Download the React DevTools",
    // Turnstile loads several third-party scripts that can emit their own warnings
    "challenges.cloudflare.com",
    // Next.js Fast Refresh noise
    "[Fast Refresh]",
    // Browser extension injections (e.g. password managers)
    "content-script",
    // React dev mode uses eval() for error overlays — blocked by our CSP (expected in dev)
    "eval() is not supported",
  ];

  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (IGNORED.some((fragment) => text.includes(fragment))) return;
    errors.push(text);
  });

  return () => errors;
}

// ---------------------------------------------------------------------------
// Test 1 — Empty-form validation
// ---------------------------------------------------------------------------

test("shows validation errors when submitting an empty form", async ({ page }) => {
  await page.goto("/contact");

  // Click submit without filling any field
  await page.getByRole("button", { name: "Send Quote Request" }).click();

  // The Zod-backed react-hook-form should surface inline error messages.
  // Match the exact strings from lib/schemas/lead.ts.
  await expect(page.getByText("First name is required")).toBeVisible();
  await expect(page.getByText("Last name is required")).toBeVisible();
  await expect(page.getByText("Enter a valid phone number")).toBeVisible();
  await expect(page.getByText("Enter a valid email address")).toBeVisible();
  await expect(page.getByText("Select a service", { exact: true })).toBeVisible();
  // Note: Turnstile auto-passes in test mode, so its error message won't appear
});

// ---------------------------------------------------------------------------
// Test 2 — Successful submission with mocked API
// ---------------------------------------------------------------------------

test("shows success state after a valid submission (mocked API)", async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);

  // Mock the API endpoint to always succeed
  await page.route("/api/leads", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  // Inject a fake window.turnstile before any page script runs.
  // addInitScript runs before all page scripts, so the component picks it up.
  await page.addInitScript(() => {
    (window as unknown as Record<string, unknown>)["turnstile"] = {
      render: (_el: unknown, opts: { callback: (t: string) => void }) => {
        setTimeout(() => opts.callback("test-token"), 100);
        return "mock-id";
      },
      remove: () => {},
      reset: () => {},
      execute: () => {},
      getResponse: () => "test-token",
      isExpired: () => false,
    };
  });

  // Fulfill Cloudflare requests with empty responses so no net::ERR_FAILED is logged
  await page.route("**/challenges.cloudflare.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/javascript", body: "" })
  );

  await page.goto("/contact");

  // Fill in required fields using name attributes set by react-hook-form register()
  await page.locator('input[name="first_name"]').fill("Test");
  await page.locator('input[name="last_name"]').fill("User");
  await page.locator('input[name="phone"]').fill("4195550000");
  await page.locator('input[name="email"]').fill("test@example.com");
  await page.locator('select[name="service_id"]').selectOption({ label: "Gutters" });

  // Wait for the mocked Turnstile callback to fire (200ms delay in mock + buffer)
  await page.waitForTimeout(500);

  await page.getByRole("button", { name: "Send Quote Request" }).click();

  // Success state renders a heading and confirmation copy
  await expect(page.getByRole("heading", { name: "Quote request sent!" })).toBeVisible({ timeout: 5000 });
  await expect(page.getByText("We'll get back to you within one business day.", { exact: true })).toBeVisible();

  // No application-level console errors should have occurred
  expect(consoleErrors()).toHaveLength(0);
});

// ---------------------------------------------------------------------------
// Test 3 — All public pages load without errors
// ---------------------------------------------------------------------------

const PUBLIC_PAGES = ["/", "/services", "/about", "/contact"] as const;

for (const path of PUBLIC_PAGES) {
  test(`page ${path} loads with status 200 and no console errors`, async ({ page, request }) => {
    const consoleErrors = collectConsoleErrors(page);

    // Verify the HTTP response is successful
    const response = await request.get(`http://localhost:3000${path}`);
    expect(response.status()).toBe(200);

    // Also navigate in the browser to catch client-side errors
    await page.goto(path);

    // Wait for the page to be fully interactive
    await page.waitForLoadState("domcontentloaded");

    // Assert no application console errors were emitted
    expect(consoleErrors()).toHaveLength(0);
  });
}
