import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Checkin } from "./Checkin";

describe("Checkin", () => {
  it("shows six clickable task checkboxes", async () => {
    const user = userEvent.setup();

    render(<Checkin onSubmit={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "今日打卡" })).toBeInTheDocument();

    const internalGroup = screen.getByRole("group", { name: "对内 3 件事" });
    expect(within(internalGroup).getAllByRole("checkbox")).toHaveLength(3);

    const externalGroup = screen.getByRole("group", { name: "对外 3 件事" });
    expect(within(externalGroup).getAllByRole("checkbox")).toHaveLength(3);

    const sleepCheckbox = screen.getByRole("checkbox", { name: "23:30 前入睡" });
    const expressionCheckbox = screen.getByRole("checkbox", { name: "发一条真实表达" });

    await user.click(sleepCheckbox);
    await user.click(expressionCheckbox);

    expect(sleepCheckbox).toBeChecked();
    expect(expressionCheckbox).toBeChecked();
  });

  it("shows default reflection text areas", () => {
    render(<Checkin onSubmit={vi.fn()} />);

    expect(screen.getByRole("textbox", { name: "今日最大的卡点" })).toHaveValue(
      "晚上还是有点想刷手机，差点拖延。",
    );
    expect(screen.getByRole("textbox", { name: "今日最想被反馈的一点" })).toHaveValue(
      "我发了一条真实表达，但还是担心别人怎么看。",
    );
  });

  it("calls onSubmit when the CTA is clicked", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<Checkin onSubmit={handleSubmit} />);
    await user.click(screen.getByRole("button", { name: "获取 AI 及时反馈" }));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
});
