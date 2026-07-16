import { describe, expect, it } from "vitest";
import {
  allMemberTasks,
  buildMemberFeedback,
  canAccessMemberWorkspace,
  completeMemberCheckin,
  concernOptions,
  createMemberPlan,
  createMemberProgramState,
  goalOptions,
  memberHomeRoute,
  memberProgramStorageKey,
  parseMemberProgramState,
  serializeMemberProgramState,
  stateOptions,
  updateMemberCheckinDraft,
  type MemberAssessment,
} from "./memberPlan";

describe("member plan rule mapping", () => {
  it("creates deterministic, clearly different 3+3 plans", () => {
    const assessments: MemberAssessment[] = [
      { concern: "rhythm", state: "low-energy", goal: "steady-rhythm" },
      { concern: "focus", state: "scattered", goal: "clear-action" },
      { concern: "expression", state: "hesitant", goal: "visible-progress" },
    ];
    const plans = assessments.map((assessment) => createMemberPlan(assessment));

    for (const plan of plans) {
      expect(plan.internal).toHaveLength(3);
      expect(plan.external).toHaveLength(3);
      expect(plan.rationale).toHaveLength(3);
      expect(new Set([...plan.internal, ...plan.external].map((task) => task.id))).toHaveLength(6);
    }

    const signatures = plans.map((plan) =>
      [...plan.internal, ...plan.external].map((task) => task.title).join("|"),
    );
    expect(new Set(signatures)).toHaveLength(3);
    expect(createMemberPlan(assessments[0])).toEqual(plans[0]);
  });
});

describe("member program flow", () => {
  it("persists safe state, restores it, and reaches Day 1 feedback", () => {
    const assessment: MemberAssessment = {
      concern: "connection",
      state: "hesitant",
      goal: "open-expression",
    };
    const initial = createMemberProgramState(assessment);
    const selectedIds = allMemberTasks(initial)
      .slice(0, 4)
      .map((task) => task.id);
    const draft = updateMemberCheckinDraft(initial, [...selectedIds, "unknown-task"]);
    expect(draft.draftCompletedTaskIds).toEqual(selectedIds);

    const refreshedDraft = parseMemberProgramState(serializeMemberProgramState(draft));
    expect(refreshedDraft).not.toBeNull();
    if (!refreshedDraft) throw new Error("Expected stored member draft to restore");
    expect(refreshedDraft.draftCompletedTaskIds).toEqual(selectedIds);
    expect(memberHomeRoute(refreshedDraft)).toBe("/member/today");

    const completed = completeMemberCheckin(refreshedDraft, selectedIds, true, true);
    expect(completed.completedDays).toBe(1);
    expect(completed.lastCheckin?.day).toBe(1);
    expect(completed.lastCheckin?.completedTaskIds).toHaveLength(4);
    expect(completed.draftCompletedTaskIds).toEqual([]);

    const feedback = buildMemberFeedback(completed);
    expect(feedback).not.toBeNull();
    expect(feedback?.paragraphs.join(" ")).toMatch(/完成了 4 个行动/);
    expect(memberHomeRoute(null)).toBe("/member/onboarding");

    const stored = serializeMemberProgramState(completed);
    expect(stored).not.toMatch(/晚上一直刷手机|请告诉我是不是生病了/);
    const refreshedCompleted = parseMemberProgramState(stored);
    expect(refreshedCompleted?.completedDays).toBe(1);
    expect(refreshedCompleted?.lastCheckin?.completedTaskIds).toHaveLength(4);
  });

  it("validates, regenerates, and resets stored program data safely", () => {
    const initial = createMemberProgramState({
      concern: "focus",
      state: "overloaded",
      goal: "clear-action",
    });
    const tampered = JSON.parse(serializeMemberProgramState(initial)) as Record<string, unknown> & {
      plan: { internal: { title: string }[] };
      draftCompletedTaskIds: string[];
    };
    tampered.plan.internal[0].title = "untrusted injected task";
    tampered.draftCompletedTaskIds = [initial.plan.internal[0].id, "unknown-task"];
    const restored = parseMemberProgramState(JSON.stringify(tampered));

    expect(restored).not.toBeNull();
    expect(restored?.plan.internal[0].title).not.toBe("untrusted injected task");
    expect(restored?.draftCompletedTaskIds).toEqual([initial.plan.internal[0].id]);
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
  it("rejects non-member and missing sessions", () => {
    expect(canAccessMemberWorkspace(null)).toBe(false);
    expect(
      canAccessMemberWorkspace({
        email: "owner@oneday.demo",
        label: "owner",
        roles: ["owner"],
      }),
    ).toBe(false);
    expect(
      canAccessMemberWorkspace({
        email: "dual@oneday.demo",
        label: "dual",
        roles: ["operator", "member"],
      }),
    ).toBe(true);
    expect(memberProgramStorageKey("member@oneday.demo")).toMatch(
      /^oneday-member-program-v1:[0-9a-f]{8}$/,
    );
    expect(memberProgramStorageKey("member@oneday.demo")).not.toContain("member@oneday.demo");
  });

  it("keeps generated tasks and template feedback inside the non-medical copy boundary", () => {
    const copy: string[] = [];

    for (const concern of concernOptions) {
      for (const state of stateOptions) {
        for (const goal of goalOptions) {
          const program = createMemberProgramState({
            concern: concern.id,
            state: state.id,
            goal: goal.id,
          });
          const tasks = allMemberTasks(program);
          copy.push(...tasks.flatMap((task) => [task.title, task.description, task.basedOn]));
          const completed = completeMemberCheckin(
            program,
            tasks.map((task) => task.id),
            true,
            true,
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
