// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
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
});
