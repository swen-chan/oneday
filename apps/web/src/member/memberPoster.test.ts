// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildMemberPosterSvg,
  downloadMemberPoster,
  shareMemberPoster,
  type MemberPosterContent,
} from "./memberPoster";

const content: MemberPosterContent = {
  day: 2,
  dateLabel: "2026年7月21日",
  completedCount: 4,
  totalTasks: 6,
  completedDays: 2,
  encouragement: "今天点亮了四个泡泡，已经把想法变成看得见的小行动。",
  nextStep: "明天先重复一个最容易开始的动作。",
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("member poster", () => {
  it("creates a branded image without any optional reflection text", () => {
    const svg = buildMemberPosterSvg(content);
    expect(svg).toContain("One Day");
    expect(svg).toContain("4 / 6");
    expect(svg).toContain("明天的一小步");
    expect(svg).not.toContain("private optional note");
  });

  it("downloads on save and falls back to download when file sharing is unavailable", async () => {
    const createObjectUrl = vi.fn(() => "blob:poster");
    const revokeObjectUrl = vi.fn();
    vi.stubGlobal("URL", {
      createObjectURL: createObjectUrl,
      revokeObjectURL: revokeObjectUrl,
    });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    vi.stubGlobal("navigator", {
      share: vi.fn(),
      canShare: () => {
        throw new Error("unsupported file share");
      },
    });

    downloadMemberPoster(content);
    expect(click).toHaveBeenCalledTimes(1);
    expect(createObjectUrl).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).toHaveBeenCalledTimes(1);

    expect(await shareMemberPoster(content)).toBe("downloaded");
    expect(click).toHaveBeenCalledTimes(2);
  });

  it("uses native file sharing when the browser supports it", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share, canShare: () => true });

    expect(await shareMemberPoster(content)).toBe("shared");
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "One Day 今日记录",
        files: [expect.any(File)],
      }),
    );
  });
});
