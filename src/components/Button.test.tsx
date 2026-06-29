import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PrimaryButton, SecondaryButton } from "./Button";

describe("Button components", () => {
  it("PrimaryButton responds to clicks", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<PrimaryButton onClick={handleClick}>继续</PrimaryButton>);
    await user.click(screen.getByRole("button", { name: "继续" }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("SecondaryButton responds to clicks", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<SecondaryButton onClick={handleClick}>重新生成反馈</SecondaryButton>);
    await user.click(screen.getByRole("button", { name: "重新生成反馈" }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
