import { demoData } from "./demoData";

const restrictedTerms = [
  "治疗",
  "治愈",
  "疗效保证",
  "改善疾病",
  "诊断",
  "医疗建议",
  "必然改变",
];

function flattenText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(flattenText).join(" ");
  }

  if (value && typeof value === "object") {
    return Object.values(value).map(flattenText).join(" ");
  }

  return "";
}

describe("demoData", () => {
  it("captures the 14-day One Day user context", () => {
    expect(demoData.user.name).toBe("小禾");
    expect(demoData.currentDay).toBe(1);
    expect(demoData.totalDays).toBe(14);
  });

  it("defines exactly three internal and three external actions", () => {
    expect(demoData.tasks.internal).toHaveLength(3);
    expect(demoData.tasks.external).toHaveLength(3);

    expect(demoData.tasks.internal.map((task) => task.title)).toEqual([
      "23:30 前入睡",
      "散步 20 分钟",
      "睡前 5 分钟复盘",
    ]);
    expect(demoData.tasks.external.map((task) => task.title)).toEqual([
      "发一条真实表达",
      "主动连接一个人",
      "推进一个作品或项目",
    ]);
  });

  it("includes AI feedback, progress metrics, and final report sections", () => {
    expect(demoData.feedback.body).toContain("重新把一天拉回自己的手里");
    expect(demoData.feedback.tags).toHaveLength(3);

    expect(demoData.progress.streakDays).toBe(1);
    expect(demoData.progress.internalCompletionRate).toBe(67);
    expect(demoData.progress.externalCompletionRate).toBe(33);
    expect(demoData.progress.timeline).toHaveLength(4);

    expect(demoData.finalReport.sections).toHaveLength(5);
    expect(demoData.finalReport.sections.map((section) => section.title)).toEqual([
      "身体节律变化",
      "情绪状态变化",
      "对外输出记录",
      "你的核心卡点",
      "下一阶段建议",
    ]);
  });

  it("avoids medically risky claims in demo copy", () => {
    const allCopy = flattenText(demoData);

    for (const term of restrictedTerms) {
      expect(allCopy).not.toContain(term);
    }
  });
});
