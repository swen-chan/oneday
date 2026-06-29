import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Feedback } from "./Feedback";

describe("Feedback", () => {
  it("shows the required AI feedback content and tags", () => {
    render(<Feedback onViewProgress={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: "One Day AI 及时反馈" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/重新把一天拉回自己的手里/)).toBeInTheDocument();
    expect(screen.getByText(/对外部分，你完成了一次真实表达/)).toBeInTheDocument();
    expect(screen.getByText("已看见你的努力")).toBeInTheDocument();
    expect(screen.getByText("明天继续一个小动作")).toBeInTheDocument();
    expect(screen.getByText("对外输出已开始")).toBeInTheDocument();
  });

  it("calls onViewProgress when the primary CTA is clicked", async () => {
    const user = userEvent.setup();
    const handleViewProgress = vi.fn();

    render(<Feedback onViewProgress={handleViewProgress} />);
    await user.click(screen.getByRole("button", { name: "查看 14 天进度" }));

    expect(handleViewProgress).toHaveBeenCalledTimes(1);
  });

  it("shows a light regenerated state without breaking the page", async () => {
    const user = userEvent.setup();

    render(<Feedback onViewProgress={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "重新生成反馈" }));

    expect(screen.getByText("已为你更新一版反馈语气")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "One Day AI 及时反馈" }),
    ).toBeInTheDocument();
  });
});
