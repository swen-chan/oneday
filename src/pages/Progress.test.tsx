import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Progress } from "./Progress";

describe("Progress", () => {
  it("shows the required 14-day progress metrics", () => {
    render(<Progress onPreviewReport={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: "14 天人生秩序重建进度" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Day 1 / 14")).toBeInTheDocument();
    expect(screen.getByText("连续打卡")).toBeInTheDocument();
    expect(screen.getByText("1 天")).toBeInTheDocument();
    expect(screen.getByText("对内完成率")).toBeInTheDocument();
    expect(screen.getByText("67%")).toBeInTheDocument();
    expect(screen.getByText("对外完成率")).toBeInTheDocument();
    expect(screen.getByText("33%")).toBeInTheDocument();
    expect(screen.getByText("当前状态")).toBeInTheDocument();
    expect(screen.getByText("秩序重建中")).toBeInTheDocument();
    expect(screen.getByText("距离结营复盘")).toBeInTheDocument();
    expect(screen.getByText("13 天")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "14 天进度" })).toHaveAttribute(
      "aria-valuenow",
      "1",
    );
  });

  it("shows all timeline milestones", () => {
    render(<Progress onPreviewReport={vi.fn()} />);

    expect(screen.getByText("Day 1")).toBeInTheDocument();
    expect(screen.getByText("建立起点")).toBeInTheDocument();
    expect(screen.getByText("Day 3")).toBeInTheDocument();
    expect(screen.getByText("看见卡点")).toBeInTheDocument();
    expect(screen.getByText("Day 7")).toBeInTheDocument();
    expect(screen.getByText("初步稳定")).toBeInTheDocument();
    expect(screen.getByText("Day 14")).toBeInTheDocument();
    expect(screen.getByText("生成结营报告")).toBeInTheDocument();
  });

  it("calls onPreviewReport when the CTA is clicked", async () => {
    const user = userEvent.setup();
    const handlePreviewReport = vi.fn();

    render(<Progress onPreviewReport={handlePreviewReport} />);
    await user.click(screen.getByRole("button", { name: "预览结营报告" }));

    expect(handlePreviewReport).toHaveBeenCalledTimes(1);
  });
});
