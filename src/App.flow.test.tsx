import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

const flowSteps = [
  {
    heading: "One Day",
    progress: "1 / 7",
    cta: "开始我的 One Day",
  },
  {
    heading: "当前状态了解",
    progress: "2 / 7",
    cta: "生成我的 3+3 行动卡",
  },
  {
    heading: "今日 3+3 行动卡",
    progress: "3 / 7",
    cta: "完成今日打卡",
  },
  {
    heading: "今日打卡",
    progress: "4 / 7",
    cta: "获取 AI 及时反馈",
  },
  {
    heading: "One Day AI 及时反馈",
    progress: "5 / 7",
    cta: "查看 14 天进度",
  },
  {
    heading: "14 天人生秩序重建进度",
    progress: "6 / 7",
    cta: "预览结营报告",
  },
  {
    heading: "14 天后，你会获得一份 One Day 结营报告",
    progress: "7 / 7",
  },
];

describe("App flow navigation", () => {
  it("starts on Landing without a back button", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: flowSteps[0].heading })).toBeInTheDocument();
    expect(screen.getByLabelText("页面进度")).toHaveTextContent(flowSteps[0].progress);
    expect(screen.queryByRole("button", { name: "返回" })).not.toBeInTheDocument();
  });

  it("moves through all seven pages using primary CTAs", async () => {
    const user = userEvent.setup();
    render(<App />);

    for (const step of flowSteps) {
      expect(screen.getByRole("heading", { name: step.heading })).toBeInTheDocument();
      expect(screen.getByLabelText("页面进度")).toHaveTextContent(step.progress);

      if (step.cta) {
        await user.click(screen.getByRole("button", { name: step.cta }));
      }
    }
  });

  it("returns to the previous page when the back button is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: flowSteps[0].cta }));
    await user.click(screen.getByRole("button", { name: flowSteps[1].cta }));

    expect(screen.getByRole("heading", { name: flowSteps[2].heading })).toBeInTheDocument();
    expect(screen.getByLabelText("页面进度")).toHaveTextContent(flowSteps[2].progress);

    await user.click(screen.getByRole("button", { name: "返回" }));

    expect(screen.getByRole("heading", { name: flowSteps[1].heading })).toBeInTheDocument();
    expect(screen.getByLabelText("页面进度")).toHaveTextContent(flowSteps[1].progress);
  });
});
