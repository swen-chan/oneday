import { describe, expect, it } from "vitest";
import {
  addMemberDays,
  advanceMemberDemoDay,
  allMemberTasks,
  buildMemberFeedback,
  canAccessMemberWorkspace,
  canSubmitMemberCheckin,
  completeMemberCheckin,
  concernOptions,
  createMemberPlan,
  createMemberProgramState,
  goalOptions,
  latestMemberCheckin,
  legacyMemberProgramStorageKey,
  memberCompletedDays,
  memberEffectiveTodayDateKey,
  memberHomeRoute,
  memberJourneyDayNumber,
  memberJourneyDays,
  memberProgramStorageKey,
  parseMemberProgramState,
  resetMemberDemoDay,
  serializeMemberProgramState,
  stateOptions,
  updateMemberCheckinDraft,
  type MemberAssessment,
} from "./memberPlan";

const assessment: MemberAssessment = {
  concern: "connection",
  state: "hesitant",
  goal: "open-expression",
};

describe("member plan rule mapping", () => {
  it("creates deterministic, clearly different 3+3 plans for a 7-day journey", () => {
    const assessments: MemberAssessment[] = [
      { concern: "rhythm", state: "low-energy", goal: "steady-rhythm" },
      { concern: "focus", state: "scattered", goal: "clear-action" },
      { concern: "expression", state: "hesitant", goal: "visible-progress" },
    ];
    const plans = assessments.map((value) => createMemberPlan(value));

    for (const plan of plans) {
      expect(plan.internal).toHaveLength(3);
      expect(plan.external).toHaveLength(3);
      expect(plan.rationale).toHaveLength(3);
      expect(new Set([...plan.internal, ...plan.external].map((task) => task.id))).toHaveLength(6);
      expect([...plan.internal, ...plan.external].map((task) => task.basedOn).join(" ")).toMatch(
        /7 天目标/,
      );
    }

    const signatures = plans.map((plan) =>
      [...plan.internal, ...plan.external].map((task) => task.title).join("|"),
    );
    expect(new Set(signatures)).toHaveLength(3);
    expect(createMemberPlan(assessments[0])).toEqual(plans[0]);
  });
});

describe("member 7-day date model", () => {
  it("binds Day 1-7 to local date keys and distinguishes recorded, missed, today, and locked", () => {
    expect(addMemberDays("2026-07-17", 1)).toBe("2026-07-18");
    expect(memberJourneyDayNumber("2026-07-17", "2026-07-19")).toBe(3);

    const initial = createMemberProgramState(assessment, "2026-07-17");
    const selectedIds = allMemberTasks(initial)
      .slice(0, 4)
      .map((task) => task.id);
    const dayOne = completeMemberCheckin(initial, selectedIds, true, true, "2026-07-17");
    const dayThree = completeMemberCheckin(dayOne, selectedIds.slice(0, 2), true, true, "2026-07-19");
    const days = memberJourneyDays(dayThree, "2026-07-19");

    expect(days.map((day) => day.status)).toEqual([
      "recorded",
      "missed",
      "recorded",
      "locked",
      "locked",
      "locked",
      "locked",
    ]);
    expect(days[2].isToday).toBe(true);
    expect(days[1].dateKey).toBe("2026-07-18");
    expect(memberCompletedDays(dayThree)).toBe(2);
    expect(latestMemberCheckin(dayThree)?.day).toBe(3);
  });

  it("allows one submission per current date, never backfills, and keeps missed days non-blocking", () => {
    const initial = createMemberProgramState(assessment, "2026-07-17");
    const taskIds = allMemberTasks(initial).map((task) => task.id);
    const dayOne = completeMemberCheckin(initial, taskIds, true, true, "2026-07-17");
    const duplicate = completeMemberCheckin(dayOne, [], true, true, "2026-07-17");

    expect(duplicate).toBe(dayOne);
    expect(canSubmitMemberCheckin(dayOne, "2026-07-17")).toBe(false);
    expect(canSubmitMemberCheckin(dayOne, "2026-07-18")).toBe(true);
    expect(canSubmitMemberCheckin(dayOne, "2026-07-19")).toBe(true);
    expect(canSubmitMemberCheckin(dayOne, "2026-07-24")).toBe(false);

    const dayThree = completeMemberCheckin(dayOne, taskIds.slice(0, 1), false, true, "2026-07-19");
    expect(dayThree.checkins.map((checkin) => checkin.day)).toEqual([1, 3]);
  });

  it("persists only safe structures and keeps drafts scoped to their date", () => {
    const initial = createMemberProgramState(assessment, "2026-07-17");
    const selectedIds = allMemberTasks(initial)
      .slice(0, 4)
      .map((task) => task.id);
    const draft = updateMemberCheckinDraft(
      initial,
      [...selectedIds, "unknown-task"],
      "2026-07-17",
    );
    expect(draft.draftCompletedTaskIds).toEqual(selectedIds);
    expect(draft.draftDateKey).toBe("2026-07-17");

    const completed = completeMemberCheckin(draft, selectedIds, true, true, "2026-07-17");
    const feedback = buildMemberFeedback(completed);
    expect(feedback?.paragraphs.join(" ")).toMatch(/完成了 4 个行动/);
    expect(completed.draftCompletedTaskIds).toEqual([]);

    const stored = serializeMemberProgramState(completed);
    expect(stored).not.toMatch(/晚上一直刷手机|请告诉我是不是生病了/);
    const refreshed = parseMemberProgramState(stored, "2026-07-17");
    expect(refreshed?.checkins).toHaveLength(1);
    expect(refreshed?.checkins[0].completedTaskIds).toHaveLength(4);
    expect(memberHomeRoute(refreshed)).toBe("/member/today");
    expect(memberHomeRoute(null)).toBe("/member/onboarding");
  });

  it("keeps demo date offset local, bounded to Day 7, and resettable", () => {
    const initial = createMemberProgramState(assessment, "2026-07-17");
    const nextDay = advanceMemberDemoDay(initial, "2026-07-17");
    expect(initial.demoDayOffset).toBe(0);
    expect(nextDay.demoDayOffset).toBe(1);
    expect(memberEffectiveTodayDateKey(nextDay, "2026-07-17")).toBe("2026-07-18");

    let daySeven = initial;
    for (let index = 0; index < 10; index += 1) {
      daySeven = advanceMemberDemoDay(daySeven, "2026-07-17");
    }
    expect(daySeven.demoDayOffset).toBe(6);
    expect(memberEffectiveTodayDateKey(daySeven, "2026-07-17")).toBe("2026-07-23");
    expect(advanceMemberDemoDay(daySeven, "2026-07-17")).toBe(daySeven);
    expect(resetMemberDemoDay(daySeven).demoDayOffset).toBe(0);
  });
});

describe("member program migration and validation", () => {
  it("upgrades the legacy single-checkin shape into versioned checkins[]", () => {
    const legacyPlan = createMemberPlan(assessment);
    const raw = JSON.stringify({
      version: 1,
      assessment,
      plan: legacyPlan,
      completedDays: 1,
      draftCompletedTaskIds: [],
      lastCheckin: {
        day: 1,
        completedTaskIds: legacyPlan.internal.slice(0, 2).map((task) => task.id),
        blockerProvided: true,
        feedbackFocusProvided: true,
      },
    });
    const migrated = parseMemberProgramState(raw, "2026-07-17");

    expect(migrated?.version).toBe(2);
    expect(migrated?.startedOn).toBe("2026-07-17");
    expect(migrated?.checkins).toEqual([
      expect.objectContaining({ day: 1, dateKey: "2026-07-17" }),
    ]);
    expect(serializeMemberProgramState(migrated!)).not.toContain("lastCheckin");
  });

  it("regenerates trusted plan copy and drops malformed history without crashing", () => {
    const initial = createMemberProgramState(
      { concern: "focus", state: "overloaded", goal: "clear-action" },
      "2026-07-17",
    );
    const tampered = JSON.parse(serializeMemberProgramState(initial)) as Record<string, unknown> & {
      plan: { internal: { title: string }[] };
      checkins: unknown[];
    };
    tampered.plan.internal[0].title = "untrusted injected task";
    tampered.checkins = [
      {
        day: 2,
        dateKey: "2099-01-01",
        completedTaskIds: [initial.plan.internal[0].id],
        blockerProvided: true,
        feedbackFocusProvided: true,
      },
    ];
    const restored = parseMemberProgramState(JSON.stringify(tampered), "2026-07-17");

    expect(restored?.plan.internal[0].title).not.toBe("untrusted injected task");
    expect(restored?.checkins).toEqual([]);
    expect(parseMemberProgramState("not-json")).toBeNull();
    expect(parseMemberProgramState(null)).toBeNull();
    expect(
      parseMemberProgramState(
        JSON.stringify({ ...initial, assessment: { ...initial.assessment, state: "invalid" } }),
      ),
    ).toBeNull();
  });
});

describe("member access and copy boundaries", () => {
  it("rejects non-member sessions and isolates current and legacy account keys", () => {
    expect(canAccessMemberWorkspace(null)).toBe(false);
    expect(
      canAccessMemberWorkspace({ email: "owner@oneday.demo", label: "owner", roles: ["owner"] }),
    ).toBe(false);
    expect(
      canAccessMemberWorkspace({
        email: "dual@oneday.demo",
        label: "dual",
        roles: ["operator", "member"],
      }),
    ).toBe(true);
    expect(memberProgramStorageKey("member@oneday.demo")).toMatch(
      /^oneday-member-program-v2:[0-9a-f]{8}$/,
    );
    expect(legacyMemberProgramStorageKey("member@oneday.demo")).toMatch(
      /^oneday-member-program-v1:[0-9a-f]{8}$/,
    );
    expect(memberProgramStorageKey("member@oneday.demo")).not.toBe(
      memberProgramStorageKey("other@oneday.demo"),
    );
  });

  it("keeps generated tasks and template feedback inside the non-medical copy boundary", () => {
    const copy: string[] = [];

    for (const concern of concernOptions) {
      for (const state of stateOptions) {
        for (const goal of goalOptions) {
          const program = createMemberProgramState(
            { concern: concern.id, state: state.id, goal: goal.id },
            "2026-07-17",
          );
          const tasks = allMemberTasks(program);
          copy.push(...tasks.flatMap((task) => [task.title, task.description, task.basedOn]));
          const completed = completeMemberCheckin(
            program,
            tasks.map((task) => task.id),
            true,
            true,
            "2026-07-17",
          );
          const feedback = buildMemberFeedback(completed);
          if (!feedback) throw new Error("Expected feedback after check-in");
          copy.push(...feedback.paragraphs);
        }
      }
    }

    expect(copy.join(" ")).not.toMatch(/诊断|治疗|治愈|疗效|疾病|康复|处方/);
  });
});
