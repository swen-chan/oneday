import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Intake } from "./Intake";

describe("Intake", () => {
  it("shows the required personalization sections and options", () => {
    render(<Intake onContinue={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "当前状态了解" })).toBeInTheDocument();

    const concerns = screen.getByRole("group", { name: "当前最大困扰" });
    expect(within(concerns).getByText("身体疲惫")).toBeInTheDocument();
    expect(within(concerns).getByText("情绪内耗")).toBeInTheDocument();
    expect(within(concerns).getByText("生活混乱")).toBeInTheDocument();
    expect(within(concerns).getByText("输出停滞")).toBeInTheDocument();

    const currentState = screen.getByRole("group", { name: "当前状态" });
    expect(within(currentState).getByText("睡眠：不稳定")).toBeInTheDocument();
    expect(within(currentState).getByText("精力：偏低")).toBeInTheDocument();
    expect(within(currentState).getByText("情绪：容易焦虑")).toBeInTheDocument();
    expect(within(currentState).getByText("输出：想做但拖延")).toBeInTheDocument();

    const desiredChanges = screen.getByRole("group", { name: "14 天后希望看到的变化" });
    expect(within(desiredChanges).getByText("更稳定的生活节律")).toBeInTheDocument();
    expect(within(desiredChanges).getByText("每天有明确行动")).toBeInTheDocument();
    expect(within(desiredChanges).getByText("开始对外表达")).toBeInTheDocument();
    expect(within(desiredChanges).getByText("看到阶段性成果")).toBeInTheDocument();
  });

  it("calls onContinue when the CTA is clicked", async () => {
    const user = userEvent.setup();
    const handleContinue = vi.fn();

    render(<Intake onContinue={handleContinue} />);
    await user.click(screen.getByRole("button", { name: "生成我的 3+3 行动卡" }));

    expect(handleContinue).toHaveBeenCalledTimes(1);
  });

  it("lets users select an option in every section", async () => {
    const user = userEvent.setup();

    render(<Intake onContinue={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "情绪内耗" }));
    await user.click(screen.getByRole("button", { name: "精力：偏低" }));
    await user.click(screen.getByRole("button", { name: "开始对外表达" }));

    expect(screen.getByRole("button", { name: "情绪内耗" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "精力：偏低" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "开始对外表达" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
