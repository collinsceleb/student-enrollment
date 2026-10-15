import { expect, test } from "@playwright/test";

test("unauthenticated visitors navigating to / are redirected to /login", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Administrator access" })
  ).toBeVisible();
});

test("login layout adapts to phone and desktop widths without overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Administrator access" })
  ).toBeVisible();

  const mobileWidth = await page.evaluate(() => ({
    pageWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(mobileWidth.pageWidth).toBeLessThanOrEqual(mobileWidth.viewportWidth);

  await page.screenshot({ path: "test-results/login-mobile.png" });

  await page.setViewportSize({ width: 1440, height: 1000 });
  const desktopWidth = await page.evaluate(() => ({
    pageWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(desktopWidth.pageWidth).toBeLessThanOrEqual(
    desktopWidth.viewportWidth
  );

  await page.screenshot({ path: "test-results/login-desktop.png" });
});
