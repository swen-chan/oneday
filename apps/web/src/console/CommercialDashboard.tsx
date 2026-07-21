"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createCommercialDataset,
  formatCurrency,
  getCommercialKpis,
  getRevenueSeries,
  getSupplyRows,
  hotelOptions,
  revenueProductOptions,
  supplyBrandOptions,
  supplyProductOptions,
  type CommercialKpi,
  type ConsoleAccess,
  type HotelSelection,
  type ReplenishmentStatus,
  type RevenueKind,
  type RevenueProductId,
  type SupplyProductId,
} from "./commercialData";

interface CommercialDashboardProps {
  brandId: string;
  accountId: string;
  access: ConsoleAccess;
}

const replenishmentLabels: Record<ReplenishmentStatus, string> = {
  restock: "立即补货",
  watch: "关注",
  healthy: "充足",
};

const replenishmentClasses: Record<ReplenishmentStatus, string> = {
  restock: "bg-warn-soft text-warn",
  watch: "bg-[#f4f1e8] text-[#8a7442]",
  healthy: "bg-brand-soft text-brand",
};

function hotelSelectionStorageKey(brandId: string, accountId: string) {
  return `oneday-console-hotel-selection:${brandId}:${encodeURIComponent(accountId.trim().toLowerCase())}`;
}

function legacyHotelSelectionStorageKey(brandId: string) {
  return `oneday-console-hotel-selection:${brandId}`;
}

function initialHotelSelection(
  brandId: string,
  accountId: string,
  access: ConsoleAccess,
): HotelSelection {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(hotelSelectionStorageKey(brandId, accountId));
    if (stored) return stored as HotelSelection;
  }
  if (access.role === "owner" || access.allowedHotelIds.length > 1) return "all";
  return access.allowedHotelIds[0] ?? "all";
}

function formatChange(metric: CommercialKpi) {
  if (metric.changeRatio === null) return "暂无环比";
  const percentage = Math.abs(metric.changeRatio * 100).toFixed(1);
  if (metric.changeRatio === 0) return "与上月持平";
  return `较上月${metric.changeRatio > 0 ? "增加" : "减少"} ${percentage}%`;
}

function formatAxisCurrency(value: number) {
  if (value >= 10000) {
    const amount = value / 10000;
    return `¥${amount >= 100 ? amount.toFixed(0) : amount.toFixed(1).replace(/\.0$/, "")}万`;
  }
  return `¥${Math.round(value).toLocaleString("zh-CN")}`;
}

function toggleValue<Value extends string>(values: readonly Value[], value: Value) {
  return values.includes(value)
    ? values.filter((current) => current !== value)
    : [...values, value];
}

function productName(productId: RevenueProductId) {
  return revenueProductOptions.find((product) => product.id === productId)?.name ?? productId;
}

export function CommercialDashboard({ brandId, accountId, access }: CommercialDashboardProps) {
  const dataset = useMemo(() => createCommercialDataset(brandId), [brandId]);
  const [hotelSelection, setHotelSelection] = useState<HotelSelection>(() =>
    initialHotelSelection(brandId, accountId, access),
  );
  const [revenueYear, setRevenueYear] = useState(2026);
  const [revenueKind, setRevenueKind] = useState<RevenueKind>("subscription");
  const [revenueProducts, setRevenueProducts] = useState<RevenueProductId[]>(
    revenueProductOptions.map((product) => product.id),
  );
  const [activeRevenueMonth, setActiveRevenueMonth] = useState<number | null>(null);
  const [supplyProducts, setSupplyProducts] = useState<SupplyProductId[]>([]);
  const allSupplyBrandIds = useMemo(
    () => Object.values(supplyBrandOptions).flatMap((brands) => brands.map((brand) => brand.id)),
    [],
  );

  const kpiResult = getCommercialKpis(dataset, access, hotelSelection);
  const revenueResult = getRevenueSeries(
    dataset,
    access,
    hotelSelection,
    revenueYear,
    revenueKind,
    revenueProducts,
  );
  const supplyResult = getSupplyRows(
    dataset,
    access,
    hotelSelection,
    supplyProducts,
    allSupplyBrandIds,
  );
  const effectiveSelection = kpiResult.scope.effectiveSelection;

  useEffect(() => {
    if (hotelSelection === effectiveSelection) return;
    setHotelSelection(effectiveSelection);
  }, [effectiveSelection, hotelSelection]);

  useEffect(() => {
    window.localStorage.removeItem(legacyHotelSelectionStorageKey(brandId));
    window.localStorage.setItem(
      hotelSelectionStorageKey(brandId, accountId),
      effectiveSelection,
    );
  }, [accountId, brandId, effectiveSelection]);

  const allowedHotelIds =
    access.role === "owner"
      ? hotelOptions.map((hotel) => hotel.id)
      : hotelOptions
          .map((hotel) => hotel.id)
          .filter((hotelId) => access.allowedHotelIds.includes(hotelId));
  const hotelChoices = hotelOptions.filter((hotel) => allowedHotelIds.includes(hotel.id));
  const canAggregateHotels = access.role === "owner" || allowedHotelIds.length > 1;
  const maxRevenue = Math.max(
    1,
    ...revenueResult.months.map((month) => month.amount ?? 0),
  );
  const revenueAxisLabels = [maxRevenue, maxRevenue / 2, 0];
  const scopeLabel =
    effectiveSelection === "all"
      ? access.role === "owner"
        ? "全部酒店"
        : "全部已授权酒店"
      : hotelOptions.find((hotel) => hotel.id === effectiveSelection)?.name ?? "授权酒店";

  const kpiCards = [
    {
      label: "当前付费会员",
      metric: kpiResult.kpis.paidMembers,
      value: `${kpiResult.kpis.paidMembers.value.toLocaleString("zh-CN")} 人`,
      note: "在订会员",
    },
    {
      label: "本月新增付费会员",
      metric: kpiResult.kpis.newPaidMembers,
      value: `${kpiResult.kpis.newPaidMembers.value.toLocaleString("zh-CN")} 人`,
      note: "2026 年 7 月",
    },
    {
      label: "本月订阅营收",
      metric: kpiResult.kpis.subscriptionRevenue,
      value: formatCurrency(kpiResult.kpis.subscriptionRevenue.value),
      note: "会员订阅",
    },
    {
      label: "本月产品营收",
      metric: kpiResult.kpis.productRevenue,
      value: formatCurrency(kpiResult.kpis.productRevenue.value),
      note: "内容 + 实物",
    },
  ];

  return (
    <>
      <section className="mb-12" data-testid="commercial-overview">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-brand">BUSINESS OVERVIEW</p>
            <h2 className="mt-2 text-xl font-bold">经营总览</h2>
            <p className="mt-1 text-sm text-ink-muted">付费会员与营收按酒店授权范围汇总</p>
          </div>
          <label className="grid gap-1.5 text-xs font-medium text-ink-muted">
            酒店范围
            {hotelChoices.length <= 1 && !canAggregateHotels ? (
              <span className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-normal text-ink">
                {scopeLabel}
              </span>
            ) : (
              <select
                aria-label="酒店范围"
                value={effectiveSelection}
                onChange={(event) => setHotelSelection(event.target.value as HotelSelection)}
                className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-normal text-ink outline-none focus:border-brand"
              >
                {canAggregateHotels && (
                  <option value="all">
                    {access.role === "owner" ? "全部酒店" : "全部已授权酒店"}
                  </option>
                )}
                {hotelChoices.map((hotel) => (
                  <option key={hotel.id} value={hotel.id}>
                    {hotel.name}
                  </option>
                ))}
              </select>
            )}
          </label>
        </div>

        {(kpiResult.scope.denied || revenueResult.scope.denied || supplyResult.scope.denied) && (
          <p className="mb-4 rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn" role="alert">
            已拦截未授权酒店范围，并安全回退到当前账号可查看的数据。
          </p>
        )}

        <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map((card, index) => (
            <div
              key={card.label}
              className={`rounded-3xl p-5 ${
                index === 0 ? "bg-brand text-white" : "border border-line bg-surface"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className={`text-sm ${index === 0 ? "text-white/75" : "text-ink-muted"}`}>
                  {card.label}
                </p>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] ${
                    index === 0 ? "bg-white/12 text-white/80" : "bg-bg text-ink-muted"
                  }`}
                >
                  {card.note}
                </span>
              </div>
              <p className="mt-5 text-3xl font-bold tracking-tight">{card.value}</p>
              <p className={`mt-2 text-xs ${index === 0 ? "text-white/75" : "text-brand"}`}>
                {formatChange(card.metric)}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold">年度月度营收</p>
              <p className="mt-1 text-xs text-ink-muted">
                {scopeLabel} · 未来月份保持留空
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                aria-label="营收年份"
                value={revenueYear}
                onChange={(event) => setRevenueYear(Number(event.target.value))}
                className="rounded-full border border-line bg-white px-3 py-2 text-xs outline-none focus:border-brand"
              >
                <option value={2026}>2026 年</option>
                <option value={2025}>2025 年</option>
              </select>
              {(["subscription", "product"] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setRevenueKind(kind)}
                  className={`rounded-full border px-3 py-2 text-xs font-medium transition ${
                    revenueKind === kind
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-line bg-white text-ink-muted"
                  }`}
                >
                  {kind === "subscription" ? "订阅营收" : "产品营收"}
                </button>
              ))}
            </div>
          </div>

          <div
            data-testid="revenue-filter-strip"
            className="mb-5 h-10 overflow-x-auto"
          >
            {revenueKind === "product" ? (
              <div className="flex h-full min-w-max items-center gap-2" aria-label="产品营收筛选">
                {revenueProductOptions.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    aria-pressed={revenueProducts.includes(product.id)}
                    onClick={() =>
                      setRevenueProducts((current) => toggleValue(current, product.id))
                    }
                    className={`shrink-0 rounded-full border px-3 py-2 text-xs transition ${
                      revenueProducts.includes(product.id)
                        ? "border-brand bg-brand text-white"
                        : "border-line bg-white text-ink-muted"
                    }`}
                  >
                    {product.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="h-full" aria-hidden="true" />
            )}
          </div>

          <div className="grid grid-cols-[3.75rem_minmax(0,1fr)] gap-3">
            <div className="pt-11" aria-label="月度营收纵轴">
              <div className="flex h-36 flex-col justify-between text-right text-[10px] leading-none text-ink-muted">
                {revenueAxisLabels.map((value, index) => (
                  <span key={value} data-testid={`revenue-axis-label-${index}`}>
                    {formatAxisCurrency(value)}
                  </span>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto pb-1">
              <div
                className="relative grid min-w-[720px] grid-cols-12 gap-2"
                aria-label="月度营收柱状图"
              >
                <div className="pointer-events-none absolute inset-x-0 top-11 h-36" aria-hidden="true">
                  <span className="absolute inset-x-0 top-0 border-t border-line" />
                  <span className="absolute inset-x-0 top-1/2 border-t border-dashed border-line" />
                  <span className="absolute inset-x-0 bottom-0 border-t border-line" />
                </div>
                {revenueResult.months.map((month) => {
                  const valueLabel = month.amount === null ? "暂无数据" : formatCurrency(month.amount);
                  const height =
                    month.amount === null
                      ? 0
                      : month.amount === 0
                        ? 0
                        : Math.max(8, Math.round((month.amount / maxRevenue) * 144));
                  const tooltipVisible =
                    month.amount !== null && activeRevenueMonth === month.month;
                  return (
                    <button
                      key={month.month}
                      type="button"
                      data-testid={`revenue-month-${month.month}`}
                      aria-label={`${month.month} 月，${valueLabel}`}
                      aria-expanded={month.amount === null ? undefined : tooltipVisible}
                      onMouseEnter={() =>
                        month.amount !== null && setActiveRevenueMonth(month.month)
                      }
                      onMouseLeave={() => setActiveRevenueMonth(null)}
                      onFocus={() => month.amount !== null && setActiveRevenueMonth(month.month)}
                      onBlur={() => setActiveRevenueMonth(null)}
                      onClick={() => month.amount !== null && setActiveRevenueMonth(month.month)}
                      className="group relative flex min-h-52 flex-col justify-end text-center outline-none"
                    >
                      <div className="relative mb-2 flex h-9 items-center justify-center">
                        {month.amount !== null ? (
                          <span
                            role="tooltip"
                            aria-hidden={!tooltipVisible}
                            data-testid={`revenue-tooltip-${month.month}`}
                            className={`whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-[10px] font-medium text-white shadow-sm transition-opacity ${
                              tooltipVisible ? "opacity-100" : "opacity-0"
                            }`}
                          >
                            {valueLabel}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex h-36 items-end justify-center px-2">
                        <div
                          data-testid={`revenue-bar-${month.month}`}
                          aria-hidden="true"
                          className={`w-full rounded-t-lg transition-all ${
                            month.amount === null
                              ? "bg-transparent"
                              : "bg-brand group-focus-visible:ring-2 group-focus-visible:ring-brand/30"
                          }`}
                          style={{ height }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-ink-muted">{month.month} 月</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          {revenueKind === "product" && revenueProducts.length === 0 && (
            <p className="mt-4 rounded-xl bg-warn-soft px-4 py-3 text-xs text-warn">
              请选择至少一种产品查看营收。
            </p>
          )}
        </div>
      </section>

      <section className="mb-12" data-testid="supply-chain">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-brand">SUPPLY CHAIN</p>
            <h2 className="mt-2 text-xl font-bold">供应链管理</h2>
            <p className="mt-1 text-sm text-ink-muted">
              {scopeLabel} · 按产品筛选，品牌在每条记录中展示；价格及库存均为合成演示数据
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSupplyProducts([])}
            className="rounded-full border border-line px-4 py-2 text-xs font-medium text-ink-muted transition hover:border-brand hover:text-brand"
          >
            清空筛选
          </button>
        </div>

        <div className="mb-4 rounded-3xl border border-line bg-surface p-5">
          <div>
            <p className="mb-2 text-xs font-medium text-ink-muted">产品（多选）</p>
            <div className="flex flex-wrap gap-2">
              {supplyProductOptions.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  aria-pressed={supplyProducts.includes(product.id)}
                  onClick={() =>
                    setSupplyProducts((current) => toggleValue(current, product.id))
                  }
                  className={`rounded-full border px-3 py-2 text-xs font-medium transition ${
                    supplyProducts.includes(product.id)
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-line bg-white text-ink-muted"
                  }`}
                >
                  {product.name}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4 text-xs text-ink-muted">
            <span>已选：</span>
            <span className="rounded-full bg-brand-soft px-2.5 py-1 text-brand">
              {supplyProducts.length
                ? supplyProducts.map((product) => productName(product)).join("、")
                : "未选产品"}
            </span>
            <span className="rounded-full bg-bg px-2.5 py-1">
              {supplyResult.rows.length} 条产品品牌记录
            </span>
          </div>
        </div>

        {supplyResult.rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line bg-surface px-6 py-12 text-center">
            <p className="text-sm font-bold">请选择要查看的产品</p>
            <p className="mt-2 text-xs text-ink-muted">选择后将显示对应品牌的价格、销售与库存记录。</p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-3xl border border-line bg-surface md:block">
              <table className="w-full min-w-[980px] border-collapse text-left text-xs">
                <thead className="bg-bg text-ink-muted">
                  <tr>
                    {[
                      "产品",
                      "品牌",
                      "市场价",
                      "竞价",
                      "折扣率",
                      "累计销量",
                      "营收",
                      "当前库存",
                      "安全库存",
                      "补货状态",
                    ].map((heading) => (
                      <th key={heading} className="px-4 py-3 font-medium">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {supplyResult.rows.map((row) => (
                    <tr key={`${row.productId}:${row.brandId}`} className="border-t border-line">
                      <td className="px-4 py-4 font-bold">{row.productName}</td>
                      <td className="px-4 py-4">
                        <span className="font-medium">{row.brandName}</span>
                        <span className="ml-1 text-[10px] text-ink-muted">虚构</span>
                      </td>
                      <td className="px-4 py-4">{formatCurrency(row.marketPrice)}</td>
                      <td className="px-4 py-4 font-medium text-brand">{formatCurrency(row.bidPrice)}</td>
                      <td className="px-4 py-4">{(row.discountRate * 100).toFixed(1)}%</td>
                      <td className="px-4 py-4">{row.unitsSold.toLocaleString("zh-CN")}</td>
                      <td className="px-4 py-4 font-medium">{formatCurrency(row.revenue)}</td>
                      <td className="px-4 py-4">{row.currentStock}</td>
                      <td className="px-4 py-4">{row.safetyStock}</td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-2.5 py-1 ${replenishmentClasses[row.replenishmentStatus]}`}>
                          {replenishmentLabels[row.replenishmentStatus]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 md:hidden">
              {supplyResult.rows.map((row) => (
                <article key={`${row.productId}:${row.brandId}`} className="rounded-3xl border border-line bg-surface p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-brand">{row.productName}</p>
                      <h3 className="mt-1 text-base font-bold">{row.brandName}</h3>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs ${replenishmentClasses[row.replenishmentStatus]}`}>
                      {replenishmentLabels[row.replenishmentStatus]}
                    </span>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                    <div><dt className="text-ink-muted">市场价 / 竞价</dt><dd className="mt-1 font-medium">{formatCurrency(row.marketPrice)} / {formatCurrency(row.bidPrice)}</dd></div>
                    <div><dt className="text-ink-muted">折扣率</dt><dd className="mt-1 font-medium">{(row.discountRate * 100).toFixed(1)}%</dd></div>
                    <div><dt className="text-ink-muted">累计销量 / 营收</dt><dd className="mt-1 font-medium">{row.unitsSold} / {formatCurrency(row.revenue)}</dd></div>
                    <div><dt className="text-ink-muted">当前 / 安全库存</dt><dd className="mt-1 font-medium">{row.currentStock} / {row.safetyStock}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
