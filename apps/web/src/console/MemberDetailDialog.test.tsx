// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemberDetailDialog } from "./MemberDetailDialog";

describe("member detail outreach", () => {
  afterEach(() => cleanup());

  it("generates, regenerates and copies a sleeping-member script without auto-send", async () => {
    const user = userEvent.setup();
    render(
      <MemberDetailDialog
        member={{
          alias: "sleeping-member",
          displayName: "晚风会员",
          lastActiveAt: "2026-05-01T00:00:00.000Z",
          messageCount: 4,
        }}
        referenceDate="2026-07-21T00:00:00.000Z"
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("沉睡会员 · 低压力唤醒")).toBeTruthy();
    expect(screen.getByText(/不会自动发送/)).toBeTruthy();
    expect(screen.getByText("当前登记")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "生成唤醒话术" }));
    const firstMessage = screen.getByTestId("member-outreach-message").textContent;
    expect(screen.getByLabelText("话术生成依据")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "重新生成" }));
    expect(screen.getByTestId("member-outreach-message").textContent).not.toBe(firstMessage);
    await user.click(screen.getByRole("button", { name: "复制话术" }));
    expect(await navigator.clipboard.readText()).toBe(
      screen.getByTestId("member-outreach-message").textContent,
    );
    expect(screen.getByRole("button", { name: "已复制" })).toBeTruthy();
  });
});
