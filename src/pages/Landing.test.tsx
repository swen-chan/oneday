import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Landing } from "./Landing";

describe("Landing", () => {
  it("shows the required first-screen One Day message", () => {
    render(<Landing onStart={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "One Day" })).toBeInTheDocument();
    expect(screen.getByText("14 天，把混乱的一天重新拉回秩序")).toBeInTheDocument();
    expect(
      screen.getByText(
        "每天完成 3 件对内修复 + 3 件对外输出，让身体、状态和人生重新开始运转。",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("修复身体")).toBeInTheDocument();
    expect(screen.getByText("稳定状态")).toBeInTheDocument();
    expect(screen.getByText("推进人生")).toBeInTheDocument();
    expect(screen.getByText("Day 1 / 14")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "开始我的 One Day" })).toBeInTheDocument();
  });

  it("calls onStart when the CTA is clicked", async () => {
    const user = userEvent.setup();
    const handleStart = vi.fn();

    render(<Landing onStart={handleStart} />);
    await user.click(screen.getByRole("button", { name: "开始我的 One Day" }));

    expect(handleStart).toHaveBeenCalledTimes(1);
  });
});
