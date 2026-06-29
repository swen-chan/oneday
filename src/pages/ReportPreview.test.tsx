import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ReportPreview } from "./ReportPreview";

describe("ReportPreview", () => {
  it("shows the required final report sections", () => {
    render(<ReportPreview />);

    expect(
      screen.getByRole("heading", { name: "14 天后，你会获得一份 One Day 结营报告" }),
    ).toBeInTheDocument();
    expect(screen.getByText("身体节律变化")).toBeInTheDocument();
    expect(screen.getByText("情绪状态变化")).toBeInTheDocument();
    expect(screen.getByText("对外输出记录")).toBeInTheDocument();
    expect(screen.getByText("你的核心卡点")).toBeInTheDocument();
    expect(screen.getByText("下一阶段建议")).toBeInTheDocument();
  });

  it("shows the final consultation and referral CTAs", () => {
    render(<ReportPreview />);

    expect(screen.getByRole("button", { name: "预约 60 分钟咨询" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "邀请朋友一起重建 One Day" }),
    ).toBeInTheDocument();
  });

  it("keeps the final page stable when CTAs are clicked", async () => {
    const user = userEvent.setup();

    render(<ReportPreview />);
    await user.click(screen.getByRole("button", { name: "预约 60 分钟咨询" }));
    await user.click(screen.getByRole("button", { name: "邀请朋友一起重建 One Day" }));

    expect(
      screen.getByRole("heading", { name: "14 天后，你会获得一份 One Day 结营报告" }),
    ).toBeInTheDocument();
  });
});
