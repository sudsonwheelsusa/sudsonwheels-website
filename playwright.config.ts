import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration for SudsOnWheels.
 *
 * - Targets the local Next.js dev server (port 3000).
 * - Uses Chromium only for CI speed; add more browsers locally as needed.
 * - Starts the dev server automatically when running `npx playwright test`.
 */
export default defineConfig({
  testDir: "./e2e",
  /* Maximum time one test can run */
  timeout: 30_000,
  /* Expect timeout for individual assertions */
  expect: { timeout: 8_000 },
  /* Re-try failed tests once on CI */
  retries: process.env.CI ? 1 : 0,
  /* Reporter: show list in terminal, generate HTML report */
  reporter: [["list"], ["html", { open: "never" }]],
  /* Shared settings for all projects */
  use: {
    baseURL: "http://localhost:3000",
    /* Collect trace on first retry for debugging */
    trace: "on-first-retry",
    /* Capture screenshot on failure */
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* Start Next.js dev server before test run, reuse if already running */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
