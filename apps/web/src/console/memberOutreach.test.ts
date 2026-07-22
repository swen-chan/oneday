import { describe, expect, it } from "vitest";
import { buildMemberOutreachDraft } from "./memberOutreach";
import { buildSyntheticMemberProfile } from "./memberProfiles";

const referenceDate = "2026-07-21T00:00:00.000Z";

describe("member outreach drafts", () => {
  it.each([
    ["active", "2026-07-20T00:00:00.000Z", "生成鼓励话术"],
    ["cooling", "2026-07-05T00:00:00.000Z", "生成关怀话术"],
    ["sleeping", "2026-05-01T00:00:00.000Z", "生成唤醒话术"],
  ] as const)("builds a structured %s draft", (layer, lastActiveAt, actionLabel) => {
    const member = {
      alias: `member-${layer}`,
      displayName: `${layer}会员`,
      lastActiveAt,
      messageCount: 8,
    };
    const profile = buildSyntheticMemberProfile(member, referenceDate);
    const draft = buildMemberOutreachDraft(member, profile, referenceDate);

    expect(profile.activityLayer).toBe(layer);
    expect(draft.actionLabel).toBe(actionLabel);
    expect(draft.basis).toContain(`加入于 ${profile.joinedAt}`);
    expect(draft.basis.some((basis) => basis.startsWith("参加过："))).toBe(true);
    expect(draft.basis.some((basis) => basis.startsWith("当前登记："))).toBe(true);
    expect(draft.message).toContain(profile.displayName);
    expect(draft.message).not.toMatch(/治疗|治愈|疗效|康复|痊愈/);
  });

  it("regenerates deterministic alternatives without using private feedback text", () => {
    const member = {
      alias: "active-member",
      displayName: "晨光会员",
      lastActiveAt: "2026-07-20T00:00:00.000Z",
      messageCount: 8,
    };
    const profile = buildSyntheticMemberProfile(member, referenceDate);
    profile.todayCheckin.feedback = "PRIVATE_FREE_TEXT_DO_NOT_USE";
    const first = buildMemberOutreachDraft(member, profile, referenceDate, 0);
    const second = buildMemberOutreachDraft(member, profile, referenceDate, 1);

    expect(second.message).not.toBe(first.message);
    expect(JSON.stringify(first)).not.toContain("PRIVATE_FREE_TEXT_DO_NOT_USE");
    expect(JSON.stringify(second)).not.toContain("PRIVATE_FREE_TEXT_DO_NOT_USE");
  });
});
