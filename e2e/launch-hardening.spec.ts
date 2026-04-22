// e2e/launch-hardening.spec.ts
import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Security headers
// ---------------------------------------------------------------------------

test("public pages include required security headers", async ({ request }) => {
  const response = await request.get("http://localhost:3000/");
  const headers = response.headers();

  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["content-security-policy"]).toContain("default-src 'self'");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["strict-transport-security"]).toContain("max-age=63072000");
});

test("portal route includes X-Robots-Tag noindex", async ({ request }) => {
  const response = await request.get("http://localhost:3000/portal");
  const headers = response.headers();
  expect(headers["x-robots-tag"]).toBe("noindex, nofollow");
});

// ---------------------------------------------------------------------------
// SEO
// ---------------------------------------------------------------------------

test("robots.txt disallows portal and references sitemap", async ({ request }) => {
  const response = await request.get("http://localhost:3000/robots.txt");
  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body).toContain("Disallow: /portal");
  expect(body).toContain("Sitemap: https://sudsonwheelsusa.com/sitemap.xml");
});

test("sitemap.xml includes all public pages and excludes portal", async ({ request }) => {
  const response = await request.get("http://localhost:3000/sitemap.xml");
  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body).toContain("sudsonwheelsusa.com/");
  expect(body).toContain("sudsonwheelsusa.com/services");
  expect(body).toContain("sudsonwheelsusa.com/about");
  expect(body).toContain("sudsonwheelsusa.com/contact");
  expect(body).not.toContain("/portal");
});

test("homepage has LocalBusiness JSON-LD schema", async ({ page }) => {
  await page.goto("/");
  const jsonLd = await page.evaluate(() => {
    const script = document.querySelector('script[type="application/ld+json"]');
    return script ? JSON.parse(script.textContent ?? "{}") : null;
  });
  expect(jsonLd).not.toBeNull();
  expect(jsonLd["@type"]).toBe("LocalBusiness");
  expect(jsonLd.name).toBe("SudsOnWheels");
  expect(jsonLd.telephone).toBe("+13309270080");
});

// ---------------------------------------------------------------------------
// Admin portal isolation
// ---------------------------------------------------------------------------

test("portal login page shows no main site navigation", async ({ page }) => {
  await page.goto("/portal");
  await expect(page.getByRole("link", { name: "Services" })).not.toBeVisible();
  await expect(page.getByRole("link", { name: "About" })).not.toBeVisible();
  await expect(page.getByRole("link", { name: "Get a Quote" })).not.toBeVisible();
});

test("portal login page has no text revealing it is admin", async ({ page }) => {
  await page.goto("/portal");
  await expect(page.getByText("Hidden Admin Access")).not.toBeVisible();
  await expect(page.getByText("admin workflow")).not.toBeVisible();
  await expect(page.getByText("Supabase auth")).not.toBeVisible();
});

// ---------------------------------------------------------------------------
// Footer content
// ---------------------------------------------------------------------------

test("footer does not expose tech stack or internal details", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Supabase")).not.toBeVisible();
  await expect(page.getByText("admin workflow")).not.toBeVisible();
});
