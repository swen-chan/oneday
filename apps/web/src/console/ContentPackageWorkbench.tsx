"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  addContentPackageFavorite,
  contentChannelOptions,
  contentDayOptions,
  contentFieldLabels,
  contentPackagePresets,
  contentToneOptions,
  createContentPackageFavorite,
  parseCalendarPackageResponse,
  readContentPackageFavorites,
  removeContentPackageFavorite,
  renameContentPackageFavorite,
  writeContentPackageFavorites,
  type ContentChannelId,
  type ContentField,
  type ContentPackageFavorite,
  type ContentPackageId,
  type ContentPackageResult,
  type ContentToneId,
} from "./contentPackageFavorites";
import { copyTextToClipboard } from "./copyText";

interface ContentBrand {
  id: string;
  name: string;
  industry: string;
  defaultTheme: string;
}

interface FavoriteEditor {
  mode: "save" | "rename";
  favoriteId?: string;
  name: string;
}

export function ContentPackageWorkbench({
  brand,
  accountId,
  apiBase,
}: {
  brand: ContentBrand;
  accountId: string;
  apiBase: string;
}) {
  const [result, setResult] = useState<ContentPackageResult | null>(null);
  const [favorites, setFavorites] = useState<ContentPackageFavorite[]>([]);
  const [selectedFavoriteId, setSelectedFavoriteId] = useState<string | null>(null);
  const [selectedPackageId, setSelectedPackageId] =
    useState<ContentPackageId>("weekly");
  const [selectedToneId, setSelectedToneId] = useState<ContentToneId>("warm");
  const [selectedChannelId, setSelectedChannelId] =
    useState<ContentChannelId>("all");
  const [customPackageName, setCustomPackageName] = useState(
    `${brand.name} 自建内容包`,
  );
  const [customPackageDays, setCustomPackageDays] = useState(10);
  const [theme, setTheme] = useState<string>(contentPackagePresets[0].theme);
  const [favoriteEditor, setFavoriteEditor] = useState<FavoriteEditor | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setFavorites(readContentPackageFavorites(window.localStorage, brand.id, accountId));
  }, [accountId, brand.id]);

  const selectedPreset = contentPackagePresets.find(
    (preset) => preset.id === selectedPackageId,
  );
  const activePackageName =
    selectedPackageId === "custom"
      ? customPackageName.trim() || "自建内容包"
      : selectedPreset?.name ?? "内容包";
  const activePackageDays =
    selectedPackageId === "custom" ? customPackageDays : selectedPreset?.days ?? 7;
  const usesPresetDayOption = contentDayOptions.some(
    (day) => day === activePackageDays,
  );
  const activeTone =
    contentToneOptions.find((tone) => tone.id === selectedToneId) ??
    contentToneOptions[0];
  const activeChannel =
    contentChannelOptions.find((channel) => channel.id === selectedChannelId) ??
    contentChannelOptions[0];
  const selectedFavorite = useMemo(
    () => favorites.find((favorite) => favorite.id === selectedFavoriteId) ?? null,
    [favorites, selectedFavoriteId],
  );

  const clearCurrentResult = () => {
    setResult(null);
    setSelectedFavoriteId(null);
    setFavoriteEditor(null);
    setPendingDeleteId(null);
    setCopiedKey(null);
    setNotice(null);
  };

  const persistFavorites = (nextFavorites: ContentPackageFavorite[]) => {
    const saved = writeContentPackageFavorites(
      window.localStorage,
      brand.id,
      accountId,
      nextFavorites,
    );
    if (!saved) {
      setError("收藏保存失败，请删除部分收藏后重试");
      return false;
    }
    setFavorites(nextFavorites);
    setError(null);
    return true;
  };

  const generate = async () => {
    setLoading(true);
    setError(null);
    setNotice(null);
    setFavoriteEditor(null);
    try {
      const response = await fetch(`${apiBase}/api/content-calendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: brand.name,
          industry: brand.industry,
          monthTheme: `${activePackageName} · ${theme || brand.defaultTheme} · ${
            activeTone.prompt
          } · ${activeChannel.prompt}`,
          days: activePackageDays,
        }),
      });
      if (!response.ok) throw new Error("request failed");
      const calendar = parseCalendarPackageResponse(await response.json());
      if (!calendar) throw new Error("invalid response");
      setResult({
        packageName: activePackageName,
        requestedDays: activePackageDays,
        theme: theme || brand.defaultTheme,
        toneId: activeTone.id,
        toneLabel: activeTone.label,
        channelId: activeChannel.id,
        channelLabel: activeChannel.label,
        channelHint: activeChannel.hint,
        channelFields: [...activeChannel.fields],
        generatedAt: new Date().toISOString(),
        calendar,
      });
      setSelectedFavoriteId(null);
      setCopiedKey(null);
    } catch {
      setError("内容生成失败，请确认 API 已启动后重试");
    } finally {
      setLoading(false);
    }
  };

  const openSaveEditor = () => {
    if (!result || selectedFavoriteId) return;
    setFavoriteEditor({ mode: "save", name: result.packageName });
    setNotice(null);
  };

  const submitFavoriteEditor = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!favoriteEditor) return;
    const normalizedName = favoriteEditor.name.trim();
    if (!normalizedName) {
      setError("请填写收藏名称");
      return;
    }
    if (favoriteEditor.mode === "save") {
      if (!result) return;
      const favorite = createContentPackageFavorite(result, normalizedName);
      const nextFavorites = addContentPackageFavorite(favorites, favorite);
      if (!persistFavorites(nextFavorites)) return;
      setSelectedFavoriteId(favorite.id);
      setFavoriteEditor(null);
      setNotice("已加入收藏列表");
      return;
    }
    if (!favoriteEditor.favoriteId) return;
    const nextFavorites = renameContentPackageFavorite(
      favorites,
      favoriteEditor.favoriteId,
      normalizedName,
    );
    if (!persistFavorites(nextFavorites)) return;
    setFavoriteEditor(null);
    setNotice("收藏名称已更新");
  };

  const selectFavorite = (favorite: ContentPackageFavorite) => {
    setResult(favorite);
    setSelectedFavoriteId(favorite.id);
    setFavoriteEditor(null);
    setPendingDeleteId(null);
    setCopiedKey(null);
    setError(null);
    setNotice(null);
  };

  const deleteFavorite = (favoriteId: string) => {
    if (pendingDeleteId !== favoriteId) {
      setPendingDeleteId(favoriteId);
      return;
    }
    const nextFavorites = removeContentPackageFavorite(favorites, favoriteId);
    if (!persistFavorites(nextFavorites)) return;
    if (selectedFavoriteId === favoriteId) setSelectedFavoriteId(null);
    setPendingDeleteId(null);
    setFavoriteEditor(null);
    setNotice("收藏已删除，当前内容仍保留在页面中");
  };

  const copyField = async (field: ContentField, dayIndex: number, text: string) => {
    const key = `${dayIndex}:${field}`;
    const copied = await copyTextToClipboard(text);
    if (!copied) {
      setError("复制失败，请手动选择文字复制");
      return;
    }
    setCopiedKey(key);
    setError(null);
    window.setTimeout(() => {
      setCopiedKey((currentKey) => (currentKey === key ? null : currentKey));
    }, 1600);
  };

  return (
    <section>
      <div className="mb-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">内容包工作台</h2>
            <p className="mt-1 text-sm text-ink-muted">
              生成后可收藏完整内容包，之后随时回来逐条复制使用
            </p>
          </div>
          {result && (
            <span className="text-xs text-ink-muted">
              引擎：
              {result.calendar.generatedBy === "template"
                ? "模板"
                : result.calendar.generatedBy}
              · 已过合规护栏
            </span>
          )}
        </div>

        <div className="mb-5 rounded-2xl border border-line bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold">收藏列表</h3>
              <p className="mt-1 text-xs text-ink-muted">
                当前账号个人收藏 · 保存在此浏览器
              </p>
            </div>
            <span className="text-xs text-ink-muted">{favorites.length} / 40</span>
          </div>
          {favorites.length === 0 ? (
            <p className="mt-4 rounded-xl bg-bg px-4 py-3 text-sm text-ink-muted">
              暂无收藏。生成内容包后，点击结果右上角“收藏”。
            </p>
          ) : (
            <div
              aria-label="内容包收藏列表"
              className="mt-4 flex gap-3 overflow-x-auto pb-2"
            >
              {favorites.map((favorite) => {
                const isSelected = favorite.id === selectedFavoriteId;
                return (
                  <div
                    key={favorite.id}
                    className={`w-56 shrink-0 rounded-2xl border p-3 transition ${
                      isSelected
                        ? "border-brand bg-brand-soft"
                        : "border-line bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => selectFavorite(favorite)}
                      className="w-full text-left"
                    >
                      <span className="block truncate text-sm font-bold">
                        {favorite.favoriteName}
                      </span>
                      <span className="mt-1 block text-xs text-ink-muted">
                        {favorite.requestedDays} 天 · {favorite.toneLabel} ·
                        {favorite.channelLabel}
                      </span>
                    </button>
                    <div className="mt-3 flex gap-3 text-xs">
                      <button
                        type="button"
                        aria-label={`重命名收藏 ${favorite.favoriteName}`}
                        onClick={() => {
                          setFavoriteEditor({
                            mode: "rename",
                            favoriteId: favorite.id,
                            name: favorite.favoriteName,
                          });
                          setPendingDeleteId(null);
                          setNotice(null);
                        }}
                        className="text-ink-muted transition hover:text-brand"
                      >
                        改名
                      </button>
                      <button
                        type="button"
                        aria-label={`${
                          pendingDeleteId === favorite.id ? "确认删除" : "删除收藏"
                        } ${favorite.favoriteName}`}
                        onClick={() => deleteFavorite(favorite.id)}
                        className="text-ink-muted transition hover:text-warn"
                      >
                        {pendingDeleteId === favorite.id ? "确认删除" : "删除"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {favoriteEditor && (
          <form
            aria-label={favoriteEditor.mode === "save" ? "保存内容包收藏" : "修改收藏名称"}
            onSubmit={submitFavoriteEditor}
            className="mb-5 flex flex-col gap-3 rounded-2xl border border-brand/20 bg-brand-soft p-4 sm:flex-row sm:items-end"
          >
            <label className="grid flex-1 gap-1.5 text-xs font-medium text-ink-muted">
              收藏名称
              <input
                autoFocus
                maxLength={40}
                value={favoriteEditor.name}
                onChange={(event) =>
                  setFavoriteEditor({ ...favoriteEditor, name: event.target.value })
                }
                className="rounded-full border border-line bg-white px-4 py-2 text-sm font-normal text-ink outline-none focus:border-brand"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white"
              >
                {favoriteEditor.mode === "save" ? "保存收藏" : "保存名称"}
              </button>
              <button
                type="button"
                onClick={() => setFavoriteEditor(null)}
                className="rounded-full border border-line bg-white px-5 py-2 text-sm text-ink-muted"
              >
                取消
              </button>
            </div>
          </form>
        )}

        <div className="mb-5 grid gap-3 md:grid-cols-4">
          {contentPackagePresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setSelectedPackageId(preset.id);
                setTheme(preset.theme);
                clearCurrentResult();
              }}
              className={`rounded-2xl border p-4 text-left transition hover:border-brand ${
                selectedPackageId === preset.id
                  ? "border-brand bg-brand-soft"
                  : "border-line bg-surface"
              }`}
            >
              <p className="text-xs text-ink-muted">{preset.goal}</p>
              <h3 className="mt-2 text-sm font-bold">{preset.name}</h3>
              <p className="mt-2 text-xs text-ink-muted">{preset.days} 天内容节奏</p>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setSelectedPackageId("custom");
              clearCurrentResult();
            }}
            className={`rounded-2xl border p-4 text-left transition hover:border-brand ${
              selectedPackageId === "custom"
                ? "border-brand bg-brand-soft"
                : "border-line bg-surface"
            }`}
          >
            <p className="text-xs text-ink-muted">订阅客户自建</p>
            <h3 className="mt-2 text-sm font-bold">自建内容包</h3>
            <p className="mt-2 text-xs text-ink-muted">预设天数 + 自定义</p>
          </button>
        </div>

        <div className="grid gap-3 rounded-2xl border border-line bg-surface p-4">
          <div
            className={`grid gap-3 ${
              selectedPackageId === "custom"
                ? "lg:grid-cols-[1fr_1.15fr_1.7fr]"
                : "lg:grid-cols-[1fr_1.7fr]"
            }`}
          >
            {selectedPackageId === "custom" && (
              <label className="grid gap-1.5 text-xs font-medium text-ink-muted">
                内容包名称
                <input
                  value={customPackageName}
                  onChange={(event) => {
                    setCustomPackageName(event.target.value);
                    clearCurrentResult();
                  }}
                  className="rounded-full border border-line bg-white px-4 py-2 text-sm font-normal text-ink outline-none focus:border-brand"
                  placeholder="如：私域唤醒包"
                />
              </label>
            )}
            <label className="grid gap-1.5 text-xs font-medium text-ink-muted">
              内容主题
              <input
                value={theme}
                onChange={(event) => {
                  setTheme(event.target.value);
                  clearCurrentResult();
                }}
                className="rounded-full border border-line bg-white px-4 py-2 text-sm font-normal text-ink outline-none focus:border-brand"
                placeholder="如：睡眠修复"
              />
            </label>
            <div className="grid gap-1.5 text-xs font-medium text-ink-muted">
              <p>天数</p>
              <span className="flex flex-wrap gap-2">
                {contentDayOptions.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      setSelectedPackageId("custom");
                      setCustomPackageDays(day);
                      clearCurrentResult();
                    }}
                    className={`rounded-full border px-3 py-2 text-xs font-medium transition hover:border-brand ${
                      activePackageDays === day
                        ? "border-brand bg-brand-soft text-brand"
                        : "border-line bg-white text-ink-muted"
                    }`}
                  >
                    {day} 天
                  </button>
                ))}
                <span
                  className={`flex items-center rounded-full border px-3 text-xs font-medium transition focus-within:border-brand ${
                    selectedPackageId === "custom" && !usesPresetDayOption
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-line bg-white text-ink-muted"
                  }`}
                >
                  自定义
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={activePackageDays}
                    onChange={(event) => {
                      const next = Number.parseInt(event.target.value, 10);
                      setSelectedPackageId("custom");
                      setCustomPackageDays(
                        Number.isNaN(next) ? 1 : Math.min(31, Math.max(1, next)),
                      );
                      clearCurrentResult();
                    }}
                    onFocus={() => setSelectedPackageId("custom")}
                    className="ml-2 w-11 bg-transparent py-2 text-center text-xs font-medium text-ink outline-none"
                    aria-label="自定义内容包天数"
                  />
                  <span className="ml-1">天</span>
                </span>
              </span>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium text-ink-muted">语气</p>
              <div className="grid grid-cols-3 gap-2">
                {contentToneOptions.map((tone) => (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => {
                      setSelectedToneId(tone.id);
                      clearCurrentResult();
                    }}
                    className={`rounded-full border px-3 py-2 text-xs font-medium transition hover:border-brand ${
                      selectedToneId === tone.id
                        ? "border-brand bg-brand-soft text-brand"
                        : "border-line bg-white text-ink-muted"
                    }`}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-ink-muted">渠道</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {contentChannelOptions.map((channel) => (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => {
                      setSelectedChannelId(channel.id);
                      clearCurrentResult();
                    }}
                    className={`rounded-xl border px-3 py-2 text-left transition hover:border-brand ${
                      selectedChannelId === channel.id
                        ? "border-brand bg-brand-soft"
                        : "border-line bg-white"
                    }`}
                  >
                    <span className="block text-xs font-medium">{channel.label}</span>
                    <span className="mt-0.5 block text-[11px] text-ink-muted">
                      {channel.hint}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void generate()}
            disabled={loading}
            className="w-full rounded-full border border-brand px-5 py-2 text-sm font-medium text-brand transition hover:bg-brand-soft disabled:opacity-50"
          >
            {loading ? "生成中…" : `生成 ${activePackageDays} 天内容包`}
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">{error}</p>
      )}
      {notice && (
        <p className="mb-4 rounded-xl bg-brand-soft px-4 py-3 text-sm text-brand">
          {notice}
        </p>
      )}

      {result && (
        <div>
          <div className="mb-4 rounded-2xl bg-brand-soft px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p
                  data-testid="content-package-result-title"
                  className="text-sm font-medium text-brand"
                >
                  {selectedFavorite?.favoriteName ?? result.packageName} ·
                  {result.calendar.days.length}/{result.requestedDays} 天
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  {brand.name} 专属内容包 · {result.calendar.monthTheme}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  输出渠道：{result.channelHint} · 语气：{result.toneLabel}
                </p>
              </div>
              <button
                type="button"
                disabled={selectedFavoriteId !== null}
                onClick={openSaveEditor}
                className="rounded-full border border-brand bg-white px-4 py-2 text-xs font-medium text-brand transition hover:bg-brand-soft disabled:cursor-default disabled:opacity-60"
              >
                {selectedFavoriteId ? "已收藏" : "收藏"}
              </button>
            </div>
            {result.calendar.failedDays.length > 0 && (
              <p className="mt-3 rounded-xl bg-warn-soft px-3 py-2 text-xs text-warn">
                {result.calendar.failedDays.length} 天未通过护栏，未展示也未保存脏内容。
              </p>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {result.calendar.days.map((day) => (
              <div
                key={day.dayIndex}
                className="rounded-2xl border border-line bg-surface p-5"
              >
                <p className="mb-3 text-xs font-medium tracking-widest text-ink-muted">
                  DAY {day.dayIndex}
                </p>
                <div className="flex flex-col gap-4 text-sm leading-relaxed">
                  {result.channelFields.map((field) => {
                    const copyKey = `${day.dayIndex}:${field}`;
                    return (
                      <div key={field}>
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <p className="text-xs text-brand">{contentFieldLabels[field]}</p>
                          <button
                            type="button"
                            aria-label={`复制 DAY ${day.dayIndex} ${contentFieldLabels[field]}`}
                            onClick={() => void copyField(field, day.dayIndex, day[field])}
                            className="text-xs text-ink-muted transition hover:text-brand"
                          >
                            {copiedKey === copyKey ? "已复制" : "复制"}
                          </button>
                        </div>
                        <p className="text-ink-soft">{day[field]}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
