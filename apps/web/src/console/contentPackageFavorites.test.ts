import { describe, expect, it } from "vitest";
import {
  addContentPackageFavorite,
  contentFavoriteStorageKey,
  createContentPackageFavorite,
  maxContentPackageFavorites,
  parseCalendarPackageResponse,
  readContentPackageFavorites,
  removeContentPackageFavorite,
  renameContentPackageFavorite,
  writeContentPackageFavorites,
  type ContentPackageResult,
} from "./contentPackageFavorites";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const result: ContentPackageResult = {
  packageName: "7 天陪跑包",
  requestedDays: 7,
  theme: "睡眠修复",
  toneId: "warm",
  toneLabel: "温柔陪伴",
  channelId: "all",
  channelLabel: "全渠道",
  channelHint: "朋友圈 / 群 / 私信",
  channelFields: ["momentsPost", "groupTopic", "dmScript"],
  generatedAt: "2026-07-22T00:00:00.000Z",
  calendar: {
    brandName: "JING",
    monthTheme: "睡眠修复 · 温柔陪伴",
    generatedBy: "template",
    days: [
      {
        dayIndex: 1,
        momentsPost: "朋友圈内容",
        groupTopic: "群话题内容",
        dmScript: "私信内容",
      },
    ],
    failedDays: [{ dayIndex: 2, reason: "未通过护栏" }],
  },
};

describe("content package favorites", () => {
  it("persists complete immutable snapshots per brand and account", () => {
    const storage = new MemoryStorage();
    const mutableResult: ContentPackageResult = {
      ...result,
      channelFields: [...result.channelFields],
      calendar: {
        ...result.calendar,
        days: result.calendar.days.map((day) => ({ ...day })),
        failedDays: result.calendar.failedDays.map((failedDay) => ({ ...failedDay })),
      },
    };
    const favorite = createContentPackageFavorite(mutableResult, "首周睡眠包", {
      id: "favorite-1",
      savedAt: "2026-07-22T01:00:00.000Z",
    });
    mutableResult.calendar.days[0].dmScript = "后来被修改";

    expect(favorite.calendar.days[0].dmScript).toBe("私信内容");
    expect(
      writeContentPackageFavorites(storage, "brand-a", "Owner@OneDay.demo", [favorite]),
    ).toBe(true);
    expect(readContentPackageFavorites(storage, "brand-a", "owner@oneday.demo")).toEqual([
      favorite,
    ]);
    expect(readContentPackageFavorites(storage, "brand-a", "other@oneday.demo")).toEqual([]);
    expect(readContentPackageFavorites(storage, "brand-b", "owner@oneday.demo")).toEqual([]);
    expect(favorite.calendar.failedDays).toEqual([
      { dayIndex: 2, reason: "未通过护栏" },
    ]);
  });

  it("renames, removes and caps favorites without changing package output", () => {
    const favorites = Array.from({ length: maxContentPackageFavorites + 5 }, (_, index) =>
      createContentPackageFavorite(result, `收藏 ${index}`, {
        id: `favorite-${index}`,
        savedAt: `2026-07-22T${String(index % 24).padStart(2, "0")}:00:00.000Z`,
      }),
    );
    const next = addContentPackageFavorite(favorites, favorites[0]);
    expect(next).toHaveLength(maxContentPackageFavorites);
    const renamed = renameContentPackageFavorite(next, "favorite-0", "新的名字");
    expect(renamed[0].favoriteName).toBe("新的名字");
    expect(renamed[0].calendar).toEqual(next[0].calendar);
    expect(removeContentPackageFavorite(renamed, "favorite-0")).toHaveLength(
      maxContentPackageFavorites - 1,
    );
  });

  it("safe-falls back from corrupt storage and accepts API responses without failedDays", () => {
    const storage = new MemoryStorage();
    storage.setItem(contentFavoriteStorageKey("brand-a", "owner@oneday.demo"), "not-json");
    expect(readContentPackageFavorites(storage, "brand-a", "owner@oneday.demo")).toEqual([]);

    expect(
      parseCalendarPackageResponse({
        brandName: "JING",
        monthTheme: "主题",
        generatedBy: "template",
        days: [
          {
            dayIndex: 1,
            momentsPost: "朋友圈",
            groupTopic: "群",
            dmScript: "私信",
          },
        ],
      })?.failedDays,
    ).toEqual([]);
  });
});
