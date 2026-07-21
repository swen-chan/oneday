// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemberWorkspace } from "./MemberWorkspace";
import {
  allMemberTasks,
  completeMemberCheckin,
  createMemberProgramState,
  demoSessionStorageKey,
  memberDateKey,
  memberProgramStorageKey,
  parseMemberProgramState,
  serializeMemberProgramState,
  type MemberProgramState,
  type MemberTask,
} from "./memberPlan";

const router = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

const memberEmail = "member@oneday.demo";
const memberStorageKey = memberProgramStorageKey(memberEmail);

function seedSession(roles: string[] = ["member"], email = memberEmail) {
  window.localStorage.setItem(
    demoSessionStorageKey,
    JSON.stringify({
      email: roles.includes("member") ? email : "owner@oneday.demo",
      label: roles.includes("member") ? "JING 会员账号" : "JING 负责人账号",
      roles,
    }),
  );
}

function seedProgram(program?: MemberProgramState) {
  const nextProgram =
    program ??
    createMemberProgramState(
      { concern: "focus", state: "scattered", goal: "visible-progress" },
      memberDateKey(),
    );
  window.localStorage.setItem(memberStorageKey, serializeMemberProgramState(nextProgram));
  return nextProgram;
}

function seedDayOneCheckin() {
  const program = seedProgram();
  const completed = completeMemberCheckin(
    program,
    allMemberTasks(program)
      .slice(0, 4)
      .map((task) => task.id),
    false,
    true,
    memberDateKey(),
    "challenging",
  );
  window.localStorage.setItem(memberStorageKey, serializeMemberProgramState(completed));
  return completed;
}

function bubbleButton(task: MemberTask, completed = false, completedDays = 0) {
  return screen.getByRole("button", {
    name: `${task.title}，今日${completed ? "已" : "未"}完成，累计 ${completedDays}/7 天`,
  });
}

describe("member workspace unified 7-day flow", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, "", "/member");
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("runs onboarding, reversible partial bubbles, same-page outcome, refresh, reassessment, and reset", async () => {
    const user = userEvent.setup();
    seedSession();

    let view = render(<MemberWorkspace view="home" />);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/member/onboarding"));
    view.unmount();

    view = render(<MemberWorkspace view="onboarding" />);
    expect(await screen.findByRole("heading", { name: "先了解今天的起点" })).toBeTruthy();
    expect(screen.getByText("3. 7 天目标")).toBeTruthy();
    await user.click(screen.getByText("注意力常被许多事情拉走"));
    await user.click(screen.getByText("思绪比较分散，需要先收拢重点"));
    await user.click(screen.getByText("留下可以看见的小成果"));
    await user.click(screen.getByRole("button", { name: "生成我的 7 天 3+3 任务" }));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/member/today"));

    let stored = parseMemberProgramState(window.localStorage.getItem(memberStorageKey));
    expect(stored?.checkins).toEqual([]);
    expect(stored?.assessment).toEqual({
      concern: "focus",
      state: "scattered",
      goal: "visible-progress",
    });
    const tasks = allMemberTasks(stored!);
    view.unmount();
    vi.clearAllMocks();

    view = render(<MemberWorkspace view="today" />);
    expect(await screen.findByRole("heading", { name: "今天，点亮你的 3+3" })).toBeTruthy();
    expect(screen.getAllByText("Day 1 / 7").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Day 1，.*今天/ }).getAttribute("aria-current")).toBe(
      "step",
    );
    expect(screen.getAllByRole("progressbar")).toHaveLength(6);
    expect(screen.getAllByRole("button", { name: /今日未完成，累计 0\/7 天/ })).toHaveLength(6);
    expect(screen.getAllByTestId("checkin-bubble")[0].className).toContain("aspect-square");
    expect(screen.getAllByTestId("checkin-bubble")[0].className).toContain("rounded-full");
    expect(screen.getAllByTestId("checkin-bubble")[0].className).toContain(
      "motion-reduce:transform-none",
    );
    expect(screen.queryByText("7 天记录")).toBeNull();
    expect(screen.queryByText(/^Day 1 ·/)).toBeNull();
    expect(screen.queryByText("演示工具")).toBeNull();

    for (const task of tasks.slice(0, 4)) {
      await user.click(bubbleButton(task));
    }
    await waitFor(() =>
      expect(
        parseMemberProgramState(window.localStorage.getItem(memberStorageKey))
          ?.draftCompletedTaskIds,
      ).toHaveLength(4),
    );

    await user.click(bubbleButton(tasks[3], true));
    await waitFor(() =>
      expect(
        parseMemberProgramState(window.localStorage.getItem(memberStorageKey))
          ?.draftCompletedTaskIds,
      ).toHaveLength(3),
    );
    await user.click(bubbleButton(tasks[3]));

    await user.click(screen.getByRole("button", { name: "完成今天" }));
    expect(screen.getByText("今天做完这些，感觉怎样？")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "有点挑战" }));
    await user.type(
      screen.getByRole("textbox", { name: /还想给今天留一句话/ }),
      "这是不会被保存的私密原文",
    );
    await user.click(screen.getByRole("button", { name: "生成今日鼓励与海报" }));

    expect(await screen.findByTestId("member-outcome")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "今天，已经向前一步" })).toBeTruthy();
    expect(screen.getByTestId("member-celebration").getAttribute("data-variant")).toBe("gentle");
    expect(screen.getByText("TODAY IS ENOUGH")).toBeTruthy();
    expect(screen.getByLabelText("One Day 今日海报预览")).toBeTruthy();
    expect(screen.getByRole("button", { name: "保存图片" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "分享" })).toBeTruthy();
    expect(router.push).not.toHaveBeenCalledWith("/member/checkin");
    expect(router.push).not.toHaveBeenCalledWith("/member/feedback");

    const rawCompleted = window.localStorage.getItem(memberStorageKey);
    expect(rawCompleted).not.toContain("这是不会被保存的私密原文");
    stored = parseMemberProgramState(rawCompleted);
    expect(stored?.checkins).toHaveLength(1);
    expect(stored?.checkins[0]).toEqual(
      expect.objectContaining({
        day: 1,
        completedTaskIds: expect.any(Array),
        blockerProvided: false,
        feedbackFocusProvided: true,
        reflectionChoice: "challenging",
      }),
    );
    expect(stored?.checkins[0].completedTaskIds).toHaveLength(4);
    expect(stored?.draftCompletedTaskIds).toEqual([]);
    for (const task of tasks.slice(0, 4)) {
      const button = bubbleButton(task, true, 1);
      expect(button.hasAttribute("disabled")).toBe(true);
    }
    expect(screen.queryByText("共完成 4 项")).toBeNull();
    expect(screen.queryByText("模板反馈")).toBeNull();
    expect(screen.queryByText("这是不会被保存的私密原文")).toBeNull();

    view.unmount();
    vi.clearAllMocks();
    view = render(<MemberWorkspace view="today" />);
    expect(await screen.findByTestId("member-outcome")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "完成今天" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "重新测评" }));
    expect(router.push).toHaveBeenCalledWith("/member/onboarding");
    view.unmount();
    vi.clearAllMocks();

    view = render(<MemberWorkspace view="onboarding" />);
    await screen.findByRole("heading", { name: "先了解今天的起点" });
    await user.click(screen.getByText("有想法，却迟迟没有开始表达"));
    await user.click(screen.getByRole("button", { name: "生成我的 7 天 3+3 任务" }));
    stored = parseMemberProgramState(window.localStorage.getItem(memberStorageKey));
    expect(stored?.checkins).toEqual([]);
    expect(stored?.assessment.concern).toBe("expression");
    view.unmount();
    vi.clearAllMocks();

    view = render(<MemberWorkspace view="today" />);
    await screen.findByRole("heading", { name: "今天，点亮你的 3+3" });
    await user.click(screen.getByRole("button", { name: "重置演示" }));
    expect(window.localStorage.getItem(memberStorageKey)).toBeNull();
    expect(router.push).toHaveBeenCalledWith("/member/onboarding");
    view.unmount();
  });

  it("shows fireworks only after all six bubbles are complete", async () => {
    const user = userEvent.setup();
    seedSession();
    const program = seedProgram();
    const tasks = allMemberTasks(program);

    render(<MemberWorkspace view="today" />);
    await screen.findByRole("heading", { name: "今天，点亮你的 3+3" });
    for (const task of tasks) {
      await user.click(bubbleButton(task));
    }
    expect(await screen.findByText("今天做完这些，感觉怎样？")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "完成今天" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "刚刚好" }));
    await user.click(screen.getByRole("button", { name: "生成今日鼓励与海报" }));

    expect(await screen.findByRole("heading", { name: "今天的六个泡泡都亮了" })).toBeTruthy();
    expect(screen.getByText("FULL DAY")).toBeTruthy();
    expect(screen.getByTestId("member-celebration").getAttribute("data-variant")).toBe(
      "fireworks",
    );
    const stored = parseMemberProgramState(window.localStorage.getItem(memberStorageKey));
    expect(stored?.checkins[0].completedTaskIds).toHaveLength(6);
    expect(stored?.checkins[0].reflectionChoice).toBe("steady");
  });

  it("keeps hidden demo controls account-local and preserves missed-day history", async () => {
    const user = userEvent.setup();
    seedSession();
    seedDayOneCheckin();
    const otherMemberKey = memberProgramStorageKey("other-member@oneday.demo");
    const otherProgram = createMemberProgramState(
      { concern: "rhythm", state: "low-energy", goal: "steady-rhythm" },
      memberDateKey(),
    );
    window.localStorage.setItem(otherMemberKey, serializeMemberProgramState(otherProgram));
    window.history.replaceState({}, "", "/member/today?demoControls=1");

    render(<MemberWorkspace view="today" />);
    await screen.findByRole("heading", { name: "今天，点亮你的 3+3" });
    await user.click(screen.getByText("演示工具"));
    await user.click(screen.getByRole("button", { name: "模拟进入下一天" }));
    await waitFor(() => expect(screen.getAllByText("Day 2 / 7").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("button", { name: "模拟进入下一天" }));
    await waitFor(() => expect(screen.getAllByText("Day 3 / 7").length).toBeGreaterThan(0));

    const missedDay = screen.getByRole("button", { name: /Day 2，.*未记录/ });
    expect(missedDay.hasAttribute("disabled")).toBe(false);
    await user.click(missedDay);
    expect(screen.getByRole("dialog", { name: "Day 2 详情" })).toBeTruthy();
    expect(screen.getByText("这一天没有记录，不影响你继续旅程。")).toBeTruthy();
    expect(screen.queryByText("7 天记录")).toBeNull();
    await user.click(screen.getByRole("button", { name: "关闭历史详情" }));

    await user.click(screen.getByRole("button", { name: /Day 1，.*已记录/ }));
    expect(screen.getByRole("dialog", { name: "Day 1 详情" })).toBeTruthy();
    expect(screen.getByText("共完成 4 项")).toBeTruthy();
    expect(screen.getByText("模板反馈")).toBeTruthy();
    expect(screen.queryByText(/^Day 1 ·/)).toBeNull();
    await user.click(screen.getByRole("button", { name: "关闭历史详情" }));

    expect(screen.getByRole("button", { name: /Day 4，.*未解锁/ }).hasAttribute("disabled")).toBe(
      true,
    );
    expect(screen.getByRole("button", { name: /Day 3，.*今天/ }).hasAttribute("disabled")).toBe(
      true,
    );
    expect(screen.getByRole("button", { name: "完成今天" }).hasAttribute("disabled")).toBe(true);

    const stored = parseMemberProgramState(window.localStorage.getItem(memberStorageKey));
    expect(stored?.demoDayOffset).toBe(2);
    expect(stored?.checkins.map((checkin) => checkin.day)).toEqual([1]);
    expect(parseMemberProgramState(window.localStorage.getItem(otherMemberKey))?.demoDayOffset).toBe(
      0,
    );

    await user.click(screen.getByRole("button", { name: "重置模拟日期" }));
    await waitFor(() => expect(screen.getAllByText("Day 1 / 7").length).toBeGreaterThan(0));
    expect(parseMemberProgramState(window.localStorage.getItem(memberStorageKey))?.demoDayOffset).toBe(
      0,
    );
  });

  it("redirects the retired check-in view and keeps non-member roles out", async () => {
    seedSession();
    seedProgram();
    let view = render(<MemberWorkspace view="checkin" />);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/member/today"));
    expect(screen.queryByRole("heading", { name: /今日打卡/ })).toBeNull();
    view.unmount();
    vi.clearAllMocks();

    window.localStorage.clear();
    seedSession(["owner"]);
    view = render(<MemberWorkspace view="today" />);
    expect(await screen.findByRole("heading", { name: "当前账号没有会员权限" })).toBeTruthy();
    expect(screen.queryByText("今天，点亮你的 3+3")).toBeNull();
    expect(window.localStorage.getItem(memberStorageKey)).toBeNull();
    view.unmount();
  });
});
