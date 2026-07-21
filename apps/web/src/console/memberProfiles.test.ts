import { describe, expect, it } from "vitest";
import { buildSyntheticMemberProfile } from "./memberProfiles";

const member = {
  alias: "member-a",
  displayName: "松林会员",
  lastActiveAt: "2026-07-21T00:00:00.000Z",
  messageCount: 7,
};

describe("synthetic member profile", () => {
  it("builds a stable activity and check-in profile without real identity fields", () => {
    const first = buildSyntheticMemberProfile(member, "2026-07-21T00:00:00.000Z");
    const second = buildSyntheticMemberProfile(member, "2026-07-21T00:00:00.000Z");

    expect(first).toEqual(second);
    expect(first.displayName).toBe("松林会员");
    expect(first.completedActivities).toHaveLength(3);
    expect(first.currentActivity.day).toBeGreaterThanOrEqual(1);
    expect(first.currentActivity.day).toBeLessThanOrEqual(first.currentActivity.totalDays);
    expect(JSON.stringify(first)).not.toMatch(/email|phone|address/i);
  });

  it("never gives cooling or sleeping members a same-day check-in", () => {
    const inactiveMembers = [
      { ...member, alias: "cooling-a", lastActiveAt: "2026-07-05T00:00:00.000Z" },
      { ...member, alias: "sleeping-a", lastActiveAt: "2026-06-01T00:00:00.000Z" },
      { ...member, alias: "sleeping-b", lastActiveAt: "2026-01-01T00:00:00.000Z" },
    ];

    for (const inactiveMember of inactiveMembers) {
      const profile = buildSyntheticMemberProfile(
        inactiveMember,
        "2026-07-21T00:00:00.000Z",
      );
      expect(profile.todayCheckin).toEqual({ status: "pending", completedCount: 0 });
    }
  });
});
