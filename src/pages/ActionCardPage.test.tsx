import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ActionCardPage } from "./ActionCardPage";

describe("ActionCardPage", () => {
  it("shows the required daily 3+3 actions", () => {
    render(<ActionCardPage onComplete={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "今日 3+3 行动卡" })).toBeInTheDocument();
    expect(
      screen.getByText("今天不用改变一生，只需要把今天过回自己手里。"),
    ).toBeInTheDocument();

    const internalCard = screen.getByRole("region", { name: "对内修复" });
    expect(within(internalCard).getAllByRole("listitem")).toHaveLength(3);
    expect(within(internalCard).getByText("23:30 前入睡")).toBeInTheDocument();
    expect(within(internalCard).getByText("散步 20 分钟")).toBeInTheDocument();
    expect(within(internalCard).getByText("睡前 5 分钟复盘")).toBeInTheDocument();

    const externalCard = screen.getByRole("region", { name: "对外输出" });
    expect(within(externalCard).getAllByRole("listitem")).toHaveLength(3);
    expect(within(externalCard).getByText("发一条真实表达")).toBeInTheDocument();
    expect(within(externalCard).getByText("主动连接一个人")).toBeInTheDocument();
    expect(within(externalCard).getByText("推进一个作品或项目")).toBeInTheDocument();
  });

  it("calls onComplete when the CTA is clicked", async () => {
    const user = userEvent.setup();
    const handleComplete = vi.fn();

    render(<ActionCardPage onComplete={handleComplete} />);
    await user.click(screen.getByRole("button", { name: "完成今日打卡" }));

    expect(handleComplete).toHaveBeenCalledTimes(1);
  });
});
