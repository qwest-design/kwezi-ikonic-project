import { defineConfig, devices } from "@playwright/test";

const PORT = 3210;

/**
 * End-to-end checks. Run with `npm run test:e2e` (builds, then tests the production
 * server). The server runs with CONTACT_TRANSPORT=test, so the contact form records
 * its email instead of sending it (see src/lib/testOutbox.ts).
 */
export default defineConfig({
  testDir: "./tests",
  timeout: 10 * 60 * 1000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1440, height: 900 },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    env: { CONTACT_TRANSPORT: "test", CONTACT_TO: "hello@ikonicdesigns.co.za" },
  },
});
