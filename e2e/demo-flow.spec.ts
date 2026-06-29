import { expect, test } from "@playwright/test";

const flow = [
  {
    heading: "One Day",
    cta: "开始我的 One Day",
  },
  {
    heading: "当前状态了解",
    cta: "生成我的 3+3 行动卡",
  },
  {
    heading: "今日 3+3 行动卡",
    cta: "完成今日打卡",
  },
  {
    heading: "今日打卡",
    cta: "获取 AI 及时反馈",
  },
  {
    heading: "One Day AI 及时反馈",
    cta: "查看 14 天进度",
  },
  {
    heading: "14 天人生秩序重建进度",
    cta: "预览结营报告",
  },
  {
    heading: "14 天后，你会获得一份 One Day 结营报告",
  },
];

test.describe("One Day mobile demo flow", () => {
  test("clicks through all seven demo pages at phone size", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    for (const [index, step] of flow.entries()) {
      await expect(page.getByLabel("页面进度")).toContainText(`${index + 1} / ${flow.length}`);

      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

      const heading = page.getByRole("heading", { name: step.heading });
      await expect(heading).toBeVisible();
      const headingTop = await heading.evaluate((element) => element.getBoundingClientRect().top);
      expect(headingTop).toBeGreaterThanOrEqual(0);

      if (step.cta) {
        await expect(page.getByRole("button", { name: step.cta })).toBeVisible();
        await page.getByRole("button", { name: step.cta }).click();
      }
    }
  });
});
