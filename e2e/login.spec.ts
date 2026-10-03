import { expect, test, type Page } from "@playwright/test";

async function mockTurnstile(page: Page) {
  await page.route(
    "https://challenges.cloudflare.com/turnstile/v0/api.js**",
    async (route) => {
      await route.fulfill({
        contentType: "application/javascript",
        body: `window.turnstile = {
          render: (_element, options) => {
            options.callback("test-turnstile-token");
            return "test-widget";
          },
          remove: () => {}
        };`,
      });
    }
  );
}

test("login displays generic credential failures returned by the server", async ({
  page,
}) => {
  await mockTurnstile(page);
  await page.route("**/api/auth/login", async (route) => {
    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataJSON()).toEqual({
      email: "admin@example.edu",
      password: "incorrect-password",
      turnstile_token: "test-turnstile-token",
      website: "",
    });

    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ message: "Invalid email or password." }),
    });
  });

  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@example.edu");
  await page.getByLabel("Password").fill("incorrect-password");
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/auth/login") &&
      response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Sign in" }).click();
  expect((await responsePromise).status()).toBe(401);

  await expect(page.getByText("Invalid email or password.")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("login presents rate-limit feedback without contacting Supabase directly", async ({
  page,
}) => {
  await mockTurnstile(page);
  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      status: 429,
      headers: { "Retry-After": "60" },
      contentType: "application/json",
      body: JSON.stringify({
        message: "Too many sign-in attempts. Please try again later.",
      }),
    });
  });

  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@example.edu");
  await page.getByLabel("Password").fill("incorrect-password");
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/auth/login") &&
      response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Sign in" }).click();
  expect((await responsePromise).status()).toBe(429);

  await expect(
    page.getByText("Too many sign-in attempts. Please try again later.")
  ).toBeVisible();
});
