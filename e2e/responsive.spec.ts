import { expect, test } from "@playwright/test";

test("enrollment layout adapts to phone and desktop widths without overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Student Enrollment" })
  ).toBeVisible();

  const mobileLayout = await page
    .locator(".enrollment-layout")
    .evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        columns: style.gridTemplateColumns.split(" ").length,
        pageWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
      };
    });
  expect(mobileLayout.columns).toBe(1);
  expect(mobileLayout.pageWidth).toBeLessThanOrEqual(
    mobileLayout.viewportWidth
  );

  await page.screenshot({ path: "test-results/enrollment-mobile.png" });

  await page.setViewportSize({ width: 1440, height: 1000 });
  const desktopLayout = await page
    .locator(".enrollment-layout")
    .evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        columns: style.gridTemplateColumns.split(" ").length,
        pageWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
      };
    });
  expect(desktopLayout.columns).toBe(2);
  expect(desktopLayout.pageWidth).toBeLessThanOrEqual(
    desktopLayout.viewportWidth
  );
  await page.screenshot({ path: "test-results/enrollment-desktop.png" });
});
