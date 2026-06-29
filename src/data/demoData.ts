export type DemoTask = {
  id: string;
  title: string;
  description: string;
};

export type IntakeOption = {
  id: string;
  label: string;
};

export type ProgressMetric = {
  label: string;
  value: string;
};

export type TimelineItem = {
  day: number;
  title: string;
};

export type ReportSection = {
  title: string;
  bullets: string[];
};

export const demoData = {
  productName: "One Day",
  user: {
    name: "小禾",
  },
  currentDay: 1,
  totalDays: 14,
  landing: {
    headline: "14 天，把混乱的一天重新拉回秩序",
    subtitle:
      "每天完成 3 件对内修复 + 3 件对外输出，让身体、状态和人生重新开始运转。",
    valueCards: ["修复身体", "稳定状态", "推进人生"],
    cta: "开始我的 One Day",
  },
  intake: {
    concerns: [
      { id: "body-fatigue", label: "身体疲惫" },
      { id: "emotion-drain", label: "情绪内耗" },
      { id: "life-chaos", label: "生活混乱" },
      { id: "output-stalled", label: "输出停滞" },
    ] satisfies IntakeOption[],
    currentState: [
      { id: "sleep", label: "睡眠：不稳定" },
      { id: "energy", label: "精力：偏低" },
      { id: "emotion", label: "情绪：容易焦虑" },
      { id: "output", label: "输出：想做但拖延" },
    ] satisfies IntakeOption[],
    desiredChanges: [
      { id: "stable-rhythm", label: "更稳定的生活节律" },
      { id: "clear-actions", label: "每天有明确行动" },
      { id: "expression", label: "开始对外表达" },
      { id: "visible-result", label: "看到阶段性成果" },
    ] satisfies IntakeOption[],
    cta: "生成我的 3+3 行动卡",
  },
  tasks: {
    internal: [
      {
        id: "sleep-before-2330",
        title: "23:30 前入睡",
        description: "重建身体节律",
      },
      {
        id: "walk-20-min",
        title: "散步 20 分钟",
        description: "让身体重新流动",
      },
      {
        id: "night-review",
        title: "睡前 5 分钟复盘",
        description: "记录今天的情绪和卡点",
      },
    ] satisfies DemoTask[],
    external: [
      {
        id: "honest-expression",
        title: "发一条真实表达",
        description: "朋友圈 / 小红书 / 社群均可",
      },
      {
        id: "reach-one-person",
        title: "主动连接一个人",
        description: "问候、合作、感谢或重新建立联系",
      },
      {
        id: "move-project",
        title: "推进一个作品或项目",
        description: "哪怕只完成一个最小步骤",
      },
    ] satisfies DemoTask[],
  },
  checkin: {
    blockerLabel: "今日最大的卡点",
    feedbackFocusLabel: "今日最想被反馈的一点",
    blockerExample: "晚上还是有点想刷手机，差点拖延。",
    feedbackFocusExample: "我发了一条真实表达，但还是担心别人怎么看。",
    cta: "获取 AI 及时反馈",
  },
  feedback: {
    title: "One Day AI 及时反馈",
    body:
      "你今天完成的不是简单打卡，而是重新把一天拉回自己的手里。\n\n" +
      "对内部分，你已经开始关注睡眠和身体节律，这是恢复秩序的基础。\n\n" +
      "对外部分，你完成了一次真实表达，这一步很关键。One Day 不只是让你变好，而是让你的变化被世界看见。\n\n" +
      "明天建议你继续抓住两个动作：早点睡，以及完成一次真实表达。不要追求完美，先追求持续。",
    tags: ["已看见你的努力", "明天继续一个小动作", "对外输出已开始"],
    primaryCta: "查看 14 天进度",
    secondaryCta: "重新生成反馈",
  },
  progress: {
    title: "14 天人生秩序重建进度",
    streakDays: 1,
    internalCompletionRate: 67,
    externalCompletionRate: 33,
    status: "秩序重建中",
    daysUntilReport: 13,
    metrics: [
      { label: "连续打卡", value: "1 天" },
      { label: "对内完成率", value: "67%" },
      { label: "对外完成率", value: "33%" },
      { label: "当前状态", value: "秩序重建中" },
      { label: "距离结营复盘", value: "13 天" },
    ] satisfies ProgressMetric[],
    timeline: [
      { day: 1, title: "建立起点" },
      { day: 3, title: "看见卡点" },
      { day: 7, title: "初步稳定" },
      { day: 14, title: "生成结营报告" },
    ] satisfies TimelineItem[],
    cta: "预览结营报告",
  },
  finalReport: {
    title: "14 天后，你会获得一份 One Day 结营报告",
    sections: [
      {
        title: "身体节律变化",
        bullets: ["睡眠", "精力", "身体感受"],
      },
      {
        title: "情绪状态变化",
        bullets: ["内耗", "焦虑", "稳定度"],
      },
      {
        title: "对外输出记录",
        bullets: ["表达次数", "连接次数", "项目推进次数"],
      },
      {
        title: "你的核心卡点",
        bullets: ["哪些事情最容易中断"],
      },
      {
        title: "下一阶段建议",
        bullets: ["是否适合进入下一期 3+3 陪跑"],
      },
    ] satisfies ReportSection[],
    primaryCta: "预约 60 分钟咨询",
    secondaryCta: "邀请朋友一起重建 One Day",
  },
} as const;
