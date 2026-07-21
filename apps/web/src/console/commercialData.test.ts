import { describe, expect, it } from "vitest";
import {
  calculateDiscountRate,
  calculateSupplyRevenue,
  createCommercialDataset,
  getCommercialKpis,
  getReplenishmentStatus,
  getRevenueSeries,
  getSupplyRows,
  revenueProductOptions,
  supplyBrandOptions,
  supplyProductOptions,
  type ConsoleAccess,
} from "./commercialData";

const ownerAccess: ConsoleAccess = {
  role: "owner",
  allowedHotelIds: ["wumingchu", "junting"],
};

const wumingchuAdminAccess: ConsoleAccess = {
  role: "operator",
  allowedHotelIds: ["wumingchu"],
};

describe("commercial console data", () => {
  const dataset = createCommercialDataset("brand-test");

  it("aggregates owner KPIs and keeps hotel-level totals separate", () => {
    const owner = getCommercialKpis(dataset, ownerAccess, "all").kpis;
    const wumingchu = getCommercialKpis(dataset, ownerAccess, "wumingchu").kpis;
    const junting = getCommercialKpis(dataset, ownerAccess, "junting").kpis;

    expect(owner.paidMembers.value).toBe(
      wumingchu.paidMembers.value + junting.paidMembers.value,
    );
    expect(owner.newPaidMembers.value).toBe(
      wumingchu.newPaidMembers.value + junting.newPaidMembers.value,
    );
    expect(owner.subscriptionRevenue.value).toBe(
      wumingchu.subscriptionRevenue.value + junting.subscriptionRevenue.value,
    );
    expect(owner.productRevenue.value).toBe(
      wumingchu.productRevenue.value + junting.productRevenue.value,
    );
    expect(owner.paidMembers.changeRatio).not.toBeNull();
  });

  it("blocks a hotel admin from forged URL, selector, or stored selections", () => {
    for (const forgedSelection of ["junting", "hotel-from-url", "tampered-local-storage"]) {
      const result = getCommercialKpis(dataset, wumingchuAdminAccess, forgedSelection);
      expect(result.scope.denied).toBe(true);
      expect(result.scope.hotelIds).toEqual(["wumingchu"]);
      expect(result.scope.effectiveSelection).toBe("wumingchu");
    }

    const forged = getCommercialKpis(dataset, wumingchuAdminAccess, "junting").kpis;
    const authorized = getCommercialKpis(dataset, ownerAccess, "wumingchu").kpis;
    const forbidden = getCommercialKpis(dataset, ownerAccess, "junting").kpis;
    expect(forged).toEqual(authorized);
    expect(forged.productRevenue.value).not.toBe(forbidden.productRevenue.value);
  });

  it("returns monthly revenue by year, kind and selected products with future months null", () => {
    const allProducts = revenueProductOptions.map((product) => product.id);
    const subscription = getRevenueSeries(
      dataset,
      ownerAccess,
      "all",
      2026,
      "subscription",
      allProducts,
    ).months;
    const currentYear = getRevenueSeries(
      dataset,
      ownerAccess,
      "all",
      2026,
      "product",
      allProducts,
    ).months;
    const essentialOilOnly = getRevenueSeries(
      dataset,
      ownerAccess,
      "all",
      2026,
      "product",
      ["essential-oil"],
    ).months;
    const offlineCampOnly = getRevenueSeries(
      dataset,
      ownerAccess,
      "all",
      2026,
      "product",
      ["camp"],
    ).months;
    const onlineCampOnly = getRevenueSeries(
      dataset,
      ownerAccess,
      "all",
      2026,
      "product",
      ["online-camp"],
    ).months;
    const previousYear = getRevenueSeries(
      dataset,
      ownerAccess,
      "all",
      2025,
      "subscription",
      allProducts,
    ).months;

    expect(currentYear.slice(0, 7).every((month) => typeof month.amount === "number")).toBe(
      true,
    );
    expect(currentYear.slice(7).map((month) => month.amount)).toEqual([
      null,
      null,
      null,
      null,
      null,
    ]);
    expect((currentYear[6].amount ?? 0) > (essentialOilOnly[6].amount ?? 0)).toBe(true);
    expect(previousYear.every((month) => typeof month.amount === "number")).toBe(true);
    expect(revenueProductOptions.map((product) => product.name)).toContain("线上营");

    const normalizedShape = (months: typeof currentYear) => {
      const amounts = months.slice(0, 7).map((month) => month.amount ?? 0);
      const maximum = Math.max(...amounts, 1);
      return amounts.map((amount) => Number((amount / maximum).toFixed(3)));
    };
    expect(normalizedShape(subscription)).not.toEqual(normalizedShape(currentYear));
    expect(normalizedShape(offlineCampOnly)).not.toEqual(normalizedShape(onlineCampOnly));
  });

  it("filters supply by the product-brand intersection and applies every formula", () => {
    const allProducts = supplyProductOptions.map((product) => product.id);
    const allBrands = Object.values(supplyBrandOptions).flatMap((brands) =>
      brands.map((brand) => brand.id),
    );
    const allRows = getSupplyRows(
      dataset,
      ownerAccess,
      "all",
      allProducts,
      allBrands,
    ).rows;
    const oilBrandIds = supplyBrandOptions["essential-oil"]
      .slice(0, 2)
      .map((brand) => brand.id);
    const filteredRows = getSupplyRows(
      dataset,
      ownerAccess,
      "all",
      ["essential-oil"],
      oilBrandIds,
    ).rows;

    expect(allRows).toHaveLength(12);
    expect(filteredRows).toHaveLength(2);
    expect(filteredRows.every((row) => row.productId === "essential-oil")).toBe(true);
    for (const row of allRows) {
      expect(row.discountRate).toBeCloseTo(row.bidPrice / row.marketPrice, 8);
      expect(row.revenue).toBe(row.unitsSold * row.bidPrice);
      expect(row.replenishmentStatus).toBe(
        getReplenishmentStatus(row.currentStock, row.safetyStock),
      );
    }
  });

  it("keeps discount, revenue and replenishment boundary rules explicit", () => {
    expect(calculateDiscountRate(80, 100)).toBe(0.8);
    expect(calculateSupplyRevenue(12, 80)).toBe(960);
    expect(getReplenishmentStatus(20, 20)).toBe("restock");
    expect(getReplenishmentStatus(30, 20)).toBe("watch");
    expect(getReplenishmentStatus(31, 20)).toBe("healthy");
  });
});
