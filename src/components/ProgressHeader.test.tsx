import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProgressHeader } from "./ProgressHeader";

describe("ProgressHeader", () => {
  it("shows the current page and total pages", () => {
    render(<ProgressHeader currentStep={3} totalSteps={7} />);

    expect(screen.getByLabelText("页面进度")).toHaveTextContent("3 / 7");
  });

  it("calls onBack when the back button is clicked", async () => {
    const user = userEvent.setup();
    const handleBack = vi.fn();

    render(<ProgressHeader currentStep={3} totalSteps={7} onBack={handleBack} />);
    await user.click(screen.getByRole("button", { name: "返回" }));

    expect(handleBack).toHaveBeenCalledTimes(1);
  });
});
