// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CommercialDashboard } from "./CommercialDashboard";

describe("commercial dashboard hotel visibility", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => cleanup());

  it("safe-falls back when a hotel admin tampers with stored selection", async () => {
    window.localStorage.setItem(
      "oneday-console-hotel-selection:brand-test",
      "junting",
    );
    render(
      <CommercialDashboard
        brandId="brand-test"
        access={{ role: "operator", allowedHotelIds: ["wumingchu"] }}
      />,
    );

    await waitFor(() =>
      expect(
        window.localStorage.getItem("oneday-console-hotel-selection:brand-test"),
      ).toBe("wumingchu"),
    );
    expect(screen.getAllByText("无名初酒店").length).toBeGreaterThan(0);
    expect(screen.queryByRole("option", { name: "君亭酒店" })).toBeNull();
  });

  it("lets the owner aggregate or select either hotel", () => {
    render(
      <CommercialDashboard
        brandId="brand-test"
        access={{ role: "owner", allowedHotelIds: ["wumingchu", "junting"] }}
      />,
    );
    const selector = screen.getByLabelText("酒店范围");
    expect(selector).toBeTruthy();
    expect(screen.getByRole("option", { name: "全部酒店" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "无名初酒店" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "君亭酒店" })).toBeTruthy();
    expect(screen.getByText("本月订阅营收")).toBeTruthy();
    expect(screen.getByText("本月产品营收")).toBeTruthy();
  });

  it("uses revenue-specific bar heights and reveals exact amounts on hover or focus", () => {
    render(
      <CommercialDashboard
        brandId="brand-test"
        access={{ role: "owner", allowedHotelIds: ["wumingchu", "junting"] }}
      />,
    );

    const subscriptionHeights = Array.from({ length: 7 }, (_, index) =>
      screen.getByTestId(`revenue-bar-${index + 1}`).style.height,
    );
    const january = screen.getByTestId("revenue-month-1");
    const januaryTooltip = screen.getByTestId("revenue-tooltip-1");
    const filterStrip = screen.getByTestId("revenue-filter-strip");

    expect(screen.getByLabelText("月度营收纵轴")).toBeTruthy();
    expect(screen.getByTestId("revenue-axis-label-2").textContent).toBe("¥0");
    expect(filterStrip.className).toContain("h-10");
    expect(within(filterStrip).queryByRole("button")).toBeNull();
    expect(januaryTooltip.className).toContain("opacity-0");
    fireEvent.mouseEnter(january);
    expect(januaryTooltip.className).toContain("opacity-100");
    fireEvent.mouseLeave(january);
    expect(januaryTooltip.className).toContain("opacity-0");
    fireEvent.focus(january);
    expect(januaryTooltip.className).toContain("opacity-100");

    fireEvent.click(screen.getByRole("button", { name: "产品营收" }));
    expect(within(filterStrip).getByRole("button", { name: "线上营" })).toBeTruthy();
    expect(filterStrip.className).toContain("h-10");
    const productHeights = Array.from({ length: 7 }, (_, index) =>
      screen.getByTestId(`revenue-bar-${index + 1}`).style.height,
    );
    expect(productHeights).not.toEqual(subscriptionHeights);
  });

  it("filters supply rows by product while keeping brands visible in each row", () => {
    render(
      <CommercialDashboard
        brandId="brand-test"
        access={{ role: "owner", allowedHotelIds: ["wumingchu", "junting"] }}
      />,
    );

    expect(screen.queryByText("品牌（多选）")).toBeNull();
    expect(screen.queryByRole("button", { name: "雾岚植萃" })).toBeNull();
    expect(screen.getAllByText("雾岚植萃").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "茶包" }));
    fireEvent.click(screen.getByRole("button", { name: "香氛" }));
    fireEvent.click(screen.getByRole("button", { name: "酒" }));

    expect(screen.getByText("3 条产品品牌记录")).toBeTruthy();
    expect(screen.queryByText("栖茶研究所")).toBeNull();
    expect(screen.getAllByText("雾岚植萃").length).toBeGreaterThan(0);
  });
});
