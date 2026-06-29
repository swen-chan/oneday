import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ActionCard,
  FeedbackCard,
  MetricCard,
  ReportSection,
  TaskCheckbox,
} from "./Cards";

describe("card components", () => {
  it("ActionCard renders a title and content", () => {
    render(
      <ActionCard title="对内修复" subtitle="恢复节律">
        <p>23:30 前入睡</p>
      </ActionCard>,
    );

    expect(screen.getByText("对内修复")).toBeInTheDocument();
    expect(screen.getByText("恢复节律")).toBeInTheDocument();
    expect(screen.getByText("23:30 前入睡")).toBeInTheDocument();
  });

  it("TaskCheckbox exposes a clickable checkbox", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<TaskCheckbox label="散步 20 分钟" checked={false} onChange={handleChange} />);
    await user.click(screen.getByRole("checkbox", { name: "散步 20 分钟" }));

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("MetricCard renders a label and value", () => {
    render(<MetricCard label="对内完成率" value="67%" />);

    expect(screen.getByText("对内完成率")).toBeInTheDocument();
    expect(screen.getByText("67%")).toBeInTheDocument();
  });

  it("FeedbackCard renders body text and tags", () => {
    render(
      <FeedbackCard
        title="One Day AI 及时反馈"
        body="你今天完成的不是简单打卡。"
        tags={["已看见你的努力"]}
      />,
    );

    expect(screen.getByText("One Day AI 及时反馈")).toBeInTheDocument();
    expect(screen.getByText("你今天完成的不是简单打卡。")).toBeInTheDocument();
    expect(screen.getByText("已看见你的努力")).toBeInTheDocument();
  });

  it("ReportSection renders bullets", () => {
    render(<ReportSection title="身体节律变化" bullets={["睡眠", "精力"]} />);

    expect(screen.getByText("身体节律变化")).toBeInTheDocument();
    expect(screen.getByText("睡眠")).toBeInTheDocument();
    expect(screen.getByText("精力")).toBeInTheDocument();
  });
});
