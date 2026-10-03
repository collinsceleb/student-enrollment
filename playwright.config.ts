import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://localhost:3001";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm exec next dev --port 3001",
    url: `${baseURL}/login`,
    reuseExistingServer: false,
    env: {
      PLAYWRIGHT_E2E: "1",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "playwright-test-site-key",
    },
    timeout: 120_000,
  },
});
