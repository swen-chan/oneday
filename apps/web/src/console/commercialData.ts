export const hotelOptions = [
  { id: "wumingchu", name: "无名初酒店" },
  { id: "junting", name: "君亭酒店" },
] as const;

export type HotelId = (typeof hotelOptions)[number]["id"];
export type HotelSelection = HotelId | "all";
export type ConsoleAccessRole = "owner" | "operator";
export type RevenueKind = "subscription" | "product";

export const revenueProductOptions = [
  { id: "camp", name: "线下营", category: "内容产品" },
  { id: "essential-oil", name: "精油", category: "实物产品" },
  { id: "tea", name: "茶包", category: "实物产品" },
  { id: "fragrance", name: "香氛", category: "实物产品" },
  { id: "alcohol", name: "酒", category: "实物产品" },
] as const;

export type RevenueProductId = (typeof revenueProductOptions)[number]["id"];
export type SupplyProductId = Exclude<RevenueProductId, "camp">;

export const supplyBrandOptions: Record<
  SupplyProductId,
  readonly { id: string; name: string }[]
> = {
  "essential-oil": [
    { id: "mist-botanics", name: "雾岚植萃" },
    { id: "wild-aroma", name: "野径芳香" },
    { id: "forest-breath", name: "森息工坊" },
  ],
  tea: [
    { id: "roost-tea", name: "栖茶研究所" },
    { id: "mountain-tea", name: "山止茶事" },
    { id: "grain-rain", name: "谷雨小集" },
  ],
  fragrance: [
    { id: "dusk-scent", name: "暮光香室" },
    { id: "blank-scent", name: "留白气味" },
    { id: "rest-scent", name: "息所香氛" },
  ],
  alcohol: [
    { id: "moon-brew", name: "月下酿造" },
    { id: "pine-wine", name: "松间小酒" },
    { id: "slow-tavern", name: "缓慢酒馆" },
  ],
};

export const supplyProductOptions = revenueProductOptions.filter(
  (product): product is (typeof revenueProductOptions)[number] & {
    id: SupplyProductId;
  } => product.id !== "camp",
);

export interface ConsoleAccess {
  role: ConsoleAccessRole;
  allowedHotelIds: readonly HotelId[];
}
export interface HotelScope {
  hotelIds: HotelId[];
  effectiveSelection: HotelSelection;
  denied: boolean;
}

interface MemberMetric {
  brandId: string;
  hotelId: HotelId;
  year: number;
  month: number;
  paidMembers: number;
  newPaidMembers: number;
}

interface RevenueRecord {
  brandId: string;
  hotelId: HotelId;
  year: number;
  month: number;
  kind: RevenueKind;
  productId?: RevenueProductId;
  amount: number;
}

interface SupplyRecord {
  brandId: string;
  hotelId: HotelId;
  productId: SupplyProductId;
  brandIdLabel: string;
  brandName: string;
  marketPrice: number;
  bidPrice: number;
  unitsSold: number;
  currentStock: number;
  safetyStock: number;
}

export interface CommercialDataset {
  brandId: string;
  referenceYear: number;
  referenceMonth: number;
  memberMetrics: MemberMetric[];
  revenueRecords: RevenueRecord[];
  supplyRecords: SupplyRecord[];
}

export interface RevenueMonth {
  month: number;
  amount: number | null;
}

export interface CommercialKpi {
  value: number;
  previousValue: number;
  changeRatio: number | null;
}

export interface CommercialKpis {
  paidMembers: CommercialKpi;
  newPaidMembers: CommercialKpi;
  subscriptionRevenue: CommercialKpi;
  productRevenue: CommercialKpi;
}

export type ReplenishmentStatus = "restock" | "watch" | "healthy";

export interface SupplyRow {
  productId: SupplyProductId;
  productName: string;
  brandId: string;
  brandName: string;
  marketPrice: number;
  bidPrice: number;
  discountRate: number;
  unitsSold: number;
  revenue: number;
  currentStock: number;
  safetyStock: number;
  replenishmentStatus: ReplenishmentStatus;
}

const occurredMonthsByYear: Record<number, number> = {
  2025: 12,
  2026: 7,
};

const hotelMultipliers: Record<HotelId, number> = {
  wumingchu: 1,
  junting: 0.82,
};

const hotelMemberBases: Record<
  HotelId,
  { previousPaid: number; currentPaid: number; previousNew: number; currentNew: number }
> = {
  wumingchu: {
    previousPaid: 352,
    currentPaid: 386,
    previousNew: 36,
    currentNew: 47,
  },
  junting: {
    previousPaid: 276,
    currentPaid: 292,
    previousNew: 28,
    currentNew: 31,
  },
};

const productRevenueBases: Record<RevenueProductId, number> = {
  camp: 92000,
  "essential-oil": 46000,
  tea: 28000,
  fragrance: 39000,
  alcohol: 33000,
};

const supplyTemplates: Record<
  SupplyProductId,
  readonly {
    marketPrice: number;
    bidPrice: number;
    unitsSold: number;
    currentStock: number;
    safetyStock: number;
  }[]
> = {
  "essential-oil": [
    { marketPrice: 398, bidPrice: 318, unitsSold: 186, currentStock: 22, safetyStock: 26 },
    { marketPrice: 328, bidPrice: 268, unitsSold: 154, currentStock: 48, safetyStock: 28 },
    { marketPrice: 458, bidPrice: 356, unitsSold: 121, currentStock: 55, safetyStock: 24 },
  ],
  tea: [
    { marketPrice: 168, bidPrice: 128, unitsSold: 278, currentStock: 60, safetyStock: 44 },
    { marketPrice: 198, bidPrice: 148, unitsSold: 231, currentStock: 34, safetyStock: 35 },
    { marketPrice: 138, bidPrice: 108, unitsSold: 315, currentStock: 91, safetyStock: 42 },
  ],
  fragrance: [
    { marketPrice: 298, bidPrice: 228, unitsSold: 164, currentStock: 18, safetyStock: 22 },
    { marketPrice: 358, bidPrice: 278, unitsSold: 139, currentStock: 37, safetyStock: 26 },
    { marketPrice: 268, bidPrice: 208, unitsSold: 197, currentStock: 71, safetyStock: 30 },
  ],
  alcohol: [
    { marketPrice: 238, bidPrice: 188, unitsSold: 172, currentStock: 25, safetyStock: 24 },
    { marketPrice: 298, bidPrice: 228, unitsSold: 146, currentStock: 19, safetyStock: 25 },
    { marketPrice: 198, bidPrice: 158, unitsSold: 203, currentStock: 68, safetyStock: 32 },
  ],
};

function hashBrandFactor(brandId: string) {
  let hash = 0;
  for (const character of brandId) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return 0.96 + (hash % 9) / 100;
}

function rounded(value: number) {
  return Math.round(value);
}

function monthSeasonality(month: number) {
  return 1 + ((month % 4) - 1.5) * 0.035 + (month >= 5 && month <= 8 ? 0.08 : 0);
}

export function createCommercialDataset(brandId: string): CommercialDataset {
  const brandFactor = hashBrandFactor(brandId);
  const memberMetrics: MemberMetric[] = [];
  const revenueRecords: RevenueRecord[] = [];
  const supplyRecords: SupplyRecord[] = [];

  for (const hotel of hotelOptions) {
    const memberBase = hotelMemberBases[hotel.id];
    memberMetrics.push(
      {
        brandId,
        hotelId: hotel.id,
        year: 2026,
        month: 6,
        paidMembers: rounded(memberBase.previousPaid * brandFactor),
        newPaidMembers: rounded(memberBase.previousNew * brandFactor),
      },
      {
        brandId,
        hotelId: hotel.id,
        year: 2026,
        month: 7,
        paidMembers: rounded(memberBase.currentPaid * brandFactor),
        newPaidMembers: rounded(memberBase.currentNew * brandFactor),
      },
    );

    for (const [yearText, occurredMonths] of Object.entries(occurredMonthsByYear)) {
      const year = Number(yearText);
      const yearFactor = year === 2026 ? 1.12 : 1;
      for (let month = 1; month <= occurredMonths; month += 1) {
        const monthlyFactor = monthSeasonality(month);
        revenueRecords.push({
          brandId,
          hotelId: hotel.id,
          year,
          month,
          kind: "subscription",
          amount: rounded(
            118000 * hotelMultipliers[hotel.id] * brandFactor * yearFactor * monthlyFactor,
          ),
        });
        for (const product of revenueProductOptions) {
          const productIndex = revenueProductOptions.findIndex(
            (option) => option.id === product.id,
          );
          revenueRecords.push({
            brandId,
            hotelId: hotel.id,
            year,
            month,
            kind: "product",
            productId: product.id,
            amount: rounded(
              productRevenueBases[product.id] *
                hotelMultipliers[hotel.id] *
                brandFactor *
                yearFactor *
                (monthlyFactor + productIndex * 0.012),
            ),
          });
        }
      }
    }

    for (const product of supplyProductOptions) {
      const brandOptions = supplyBrandOptions[product.id];
      const templates = supplyTemplates[product.id];
      brandOptions.forEach((supplyBrand, index) => {
        const template = templates[index];
        const hotelFactor = hotelMultipliers[hotel.id];
        supplyRecords.push({
          brandId,
          hotelId: hotel.id,
          productId: product.id,
          brandIdLabel: supplyBrand.id,
          brandName: supplyBrand.name,
          marketPrice: template.marketPrice,
          bidPrice: template.bidPrice,
          unitsSold: rounded(template.unitsSold * hotelFactor * brandFactor),
          currentStock: rounded(template.currentStock * hotelFactor),
          safetyStock: rounded(template.safetyStock * hotelFactor),
        });
      });
    }
  }

  return {
    brandId,
    referenceYear: 2026,
    referenceMonth: 7,
    memberMetrics,
    revenueRecords,
    supplyRecords,
  };
}

function validHotelIds(hotelIds: readonly string[]) {
  const knownHotelIds = new Set<HotelId>(hotelOptions.map((hotel) => hotel.id));
  return [...new Set(hotelIds)].filter((hotelId): hotelId is HotelId =>
    knownHotelIds.has(hotelId as HotelId),
  );
}

export function resolveHotelScope(
  access: ConsoleAccess,
  requestedSelection: string | null | undefined,
): HotelScope {
  const requested = requestedSelection ?? "all";
  const allHotelIds = hotelOptions.map((hotel) => hotel.id);

  if (access.role === "owner") {
    if (requested === "all") {
      return { hotelIds: allHotelIds, effectiveSelection: "all", denied: false };
    }
    if (allHotelIds.includes(requested as HotelId)) {
      return {
        hotelIds: [requested as HotelId],
        effectiveSelection: requested as HotelId,
        denied: false,
      };
    }
    return { hotelIds: allHotelIds, effectiveSelection: "all", denied: true };
  }

  const allowedHotelIds = validHotelIds(access.allowedHotelIds);
  if (allowedHotelIds.length === 0) {
    return { hotelIds: [], effectiveSelection: "all", denied: true };
  }
  if (requested === "all") {
    return {
      hotelIds: allowedHotelIds,
      effectiveSelection: allowedHotelIds.length === 1 ? allowedHotelIds[0] : "all",
      denied: false,
    };
  }
  if (allowedHotelIds.includes(requested as HotelId)) {
    return {
      hotelIds: [requested as HotelId],
      effectiveSelection: requested as HotelId,
      denied: false,
    };
  }
  return {
    hotelIds: [allowedHotelIds[0]],
    effectiveSelection: allowedHotelIds[0],
    denied: true,
  };
}

function changeRatio(currentValue: number, previousValue: number) {
  if (previousValue === 0) return null;
  return (currentValue - previousValue) / previousValue;
}

function sumRevenue(
  dataset: CommercialDataset,
  hotelIds: readonly HotelId[],
  year: number,
  month: number,
  kind: RevenueKind,
  productIds: readonly RevenueProductId[] = revenueProductOptions.map(
    (product) => product.id,
  ),
) {
  return dataset.revenueRecords
    .filter(
      (record) =>
        record.brandId === dataset.brandId &&
        hotelIds.includes(record.hotelId) &&
        record.year === year &&
        record.month === month &&
        record.kind === kind &&
        (kind === "subscription" ||
          (record.productId !== undefined && productIds.includes(record.productId))),
    )
    .reduce((total, record) => total + record.amount, 0);
}

export function getCommercialKpis(
  dataset: CommercialDataset,
  access: ConsoleAccess,
  requestedSelection: string | null | undefined,
): { scope: HotelScope; kpis: CommercialKpis } {
  const scope = resolveHotelScope(access, requestedSelection);
  const currentMetrics = dataset.memberMetrics.filter(
    (metric) =>
      metric.brandId === dataset.brandId &&
      scope.hotelIds.includes(metric.hotelId) &&
      metric.year === dataset.referenceYear &&
      metric.month === dataset.referenceMonth,
  );
  const previousMonth = dataset.referenceMonth === 1 ? 12 : dataset.referenceMonth - 1;
  const previousYear =
    dataset.referenceMonth === 1 ? dataset.referenceYear - 1 : dataset.referenceYear;
  const previousMetrics = dataset.memberMetrics.filter(
    (metric) =>
      metric.brandId === dataset.brandId &&
      scope.hotelIds.includes(metric.hotelId) &&
      metric.year === previousYear &&
      metric.month === previousMonth,
  );
  const paidMembers = currentMetrics.reduce((total, metric) => total + metric.paidMembers, 0);
  const previousPaidMembers = previousMetrics.reduce(
    (total, metric) => total + metric.paidMembers,
    0,
  );
  const newPaidMembers = currentMetrics.reduce(
    (total, metric) => total + metric.newPaidMembers,
    0,
  );
  const previousNewPaidMembers = previousMetrics.reduce(
    (total, metric) => total + metric.newPaidMembers,
    0,
  );
  const subscriptionRevenue = sumRevenue(
    dataset,
    scope.hotelIds,
    dataset.referenceYear,
    dataset.referenceMonth,
    "subscription",
  );
  const previousSubscriptionRevenue = sumRevenue(
    dataset,
    scope.hotelIds,
    previousYear,
    previousMonth,
    "subscription",
  );
  const productRevenue = sumRevenue(
    dataset,
    scope.hotelIds,
    dataset.referenceYear,
    dataset.referenceMonth,
    "product",
  );
  const previousProductRevenue = sumRevenue(
    dataset,
    scope.hotelIds,
    previousYear,
    previousMonth,
    "product",
  );

  return {
    scope,
    kpis: {
      paidMembers: {
        value: paidMembers,
        previousValue: previousPaidMembers,
        changeRatio: changeRatio(paidMembers, previousPaidMembers),
      },
      newPaidMembers: {
        value: newPaidMembers,
        previousValue: previousNewPaidMembers,
        changeRatio: changeRatio(newPaidMembers, previousNewPaidMembers),
      },
      subscriptionRevenue: {
        value: subscriptionRevenue,
        previousValue: previousSubscriptionRevenue,
        changeRatio: changeRatio(subscriptionRevenue, previousSubscriptionRevenue),
      },
      productRevenue: {
        value: productRevenue,
        previousValue: previousProductRevenue,
        changeRatio: changeRatio(productRevenue, previousProductRevenue),
      },
    },
  };
}

export function getRevenueSeries(
  dataset: CommercialDataset,
  access: ConsoleAccess,
  requestedSelection: string | null | undefined,
  year: number,
  kind: RevenueKind,
  productIds: readonly RevenueProductId[],
): { scope: HotelScope; months: RevenueMonth[] } {
  const scope = resolveHotelScope(access, requestedSelection);
  return {
    scope,
    months: Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const isFuture =
        year > dataset.referenceYear ||
        (year === dataset.referenceYear && month > dataset.referenceMonth);
      return {
        month,
        amount: isFuture
          ? null
          : sumRevenue(dataset, scope.hotelIds, year, month, kind, productIds),
      };
    }),
  };
}

export function calculateDiscountRate(bidPrice: number, marketPrice: number) {
  return marketPrice <= 0 ? 0 : bidPrice / marketPrice;
}

export function calculateSupplyRevenue(unitsSold: number, bidPrice: number) {
  return unitsSold * bidPrice;
}

export function getReplenishmentStatus(
  currentStock: number,
  safetyStock: number,
): ReplenishmentStatus {
  if (currentStock <= safetyStock) return "restock";
  if (currentStock <= safetyStock * 1.5) return "watch";
  return "healthy";
}

export function getSupplyRows(
  dataset: CommercialDataset,
  access: ConsoleAccess,
  requestedSelection: string | null | undefined,
  productIds: readonly SupplyProductId[],
  brandIds: readonly string[],
): { scope: HotelScope; rows: SupplyRow[] } {
  const scope = resolveHotelScope(access, requestedSelection);
  const productNames = new Map(
    supplyProductOptions.map((product) => [product.id, product.name]),
  );
  const groupedRows = new Map<string, SupplyRow>();

  dataset.supplyRecords
    .filter(
      (record) =>
        record.brandId === dataset.brandId &&
        scope.hotelIds.includes(record.hotelId) &&
        productIds.includes(record.productId) &&
        brandIds.includes(record.brandIdLabel),
    )
    .forEach((record) => {
      const groupKey = `${record.productId}:${record.brandIdLabel}`;
      const existing = groupedRows.get(groupKey);
      if (existing) {
        const unitsSold = existing.unitsSold + record.unitsSold;
        const currentStock = existing.currentStock + record.currentStock;
        const safetyStock = existing.safetyStock + record.safetyStock;
        groupedRows.set(groupKey, {
          ...existing,
          unitsSold,
          revenue: calculateSupplyRevenue(unitsSold, existing.bidPrice),
          currentStock,
          safetyStock,
          replenishmentStatus: getReplenishmentStatus(currentStock, safetyStock),
        });
        return;
      }
      groupedRows.set(groupKey, {
        productId: record.productId,
        productName: productNames.get(record.productId) ?? record.productId,
        brandId: record.brandIdLabel,
        brandName: record.brandName,
        marketPrice: record.marketPrice,
        bidPrice: record.bidPrice,
        discountRate: calculateDiscountRate(record.bidPrice, record.marketPrice),
        unitsSold: record.unitsSold,
        revenue: calculateSupplyRevenue(record.unitsSold, record.bidPrice),
        currentStock: record.currentStock,
        safetyStock: record.safetyStock,
        replenishmentStatus: getReplenishmentStatus(
          record.currentStock,
          record.safetyStock,
        ),
      });
    });

  return {
    scope,
    rows: [...groupedRows.values()].sort(
      (firstRow, secondRow) =>
        firstRow.productName.localeCompare(secondRow.productName, "zh-CN") ||
        firstRow.brandName.localeCompare(secondRow.brandName, "zh-CN"),
    ),
  };
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(value);
}
