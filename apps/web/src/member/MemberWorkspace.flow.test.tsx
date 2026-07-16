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

function seedDayOneCheckin() {
  const program = createMemberProgramState(
    { concern: "focus", state: "scattered", goal: "visible-progress" },
    memberDateKey(),
  );
  const completed = completeMemberCheckin(
    program,
    allMemberTasks(program)
      .slice(0, 4)
      .map((task) => task.id),
    true,
    true,
  );
  window.localStorage.setItem(memberStorageKey, serializeMemberProgramState(completed));
}

describe("member workspace 7-day flow", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, "", "/member");
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("runs onboarding, one same-day check-in, safe history detail, refresh, reassessment, and reset", async () => {
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
    await user.click(screen.getByRole("button", { name: "生成我的 3+3 今日任务" }));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/member/today"));

    let stored = parseMemberProgramState(window.localStorage.getItem(memberStorageKey));
    expect(stored?.checkins).toEqual([]);
    expect(stored?.assessment).toEqual({
      concern: "focus",
      state: "scattered",
      goal: "visible-progress",
    });
    view.unmount();
    vi.clearAllMocks();

    view = render(<MemberWorkspace view="today" />);
    expect(await screen.findByRole("heading", { name: "今天只完成 3+3" })).toBeTruthy();
    expect(screen.getByText("Day 1 / 7")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Day 1，.*今天/ }).getAttribute("aria-current")).toBe(
      "step",
    );
    expect(screen.getByText("做一张三项清空清单")).toBeTruthy();
    expect(screen.getAllByText(/^依据：/)).toHaveLength(6);
    expect(screen.queryByText("演示工具")).toBeNull();
    await user.click(screen.getByRole("button", { name: "开始 Day 1 打卡" }));
    expect(router.push).toHaveBeenCalledWith("/member/checkin");
    view.unmount();
    vi.clearAllMocks();

    view = render(<MemberWorkspace view="checkin" />);
    expect(await screen.findByRole("heading", { name: "Day 1 今日打卡" })).toBeTruthy();
    const taskCheckboxes = screen.getAllByRole("checkbox");
    expect(taskCheckboxes).toHaveLength(6);
    for (const checkbox of taskCheckboxes.slice(0, 4)) {
      await user.click(checkbox);
    }
    const reflectionFields = screen.getAllByRole("textbox");
    await user.type(reflectionFields[0], "晚上一直刷手机");
    await user.type(reflectionFields[1], "请告诉我明天怎样更容易开始");
    await user.click(screen.getByRole("button", { name: "提交并查看模板反馈" }));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/member/feedback"));

    const rawCompleted = window.localStorage.getItem(memberStorageKey);
    expect(rawCompleted).not.toContain("晚上一直刷手机");
    expect(rawCompleted).not.toContain("请告诉我明天怎样更容易开始");
    stored = parseMemberProgramState(rawCompleted);
    expect(stored?.checkins).toHaveLength(1);
    expect(stored?.checkins[0].day).toBe(1);
    expect(stored?.checkins[0].completedTaskIds).toHaveLength(4);
    view.unmount();
    vi.clearAllMocks();

    view = render(<MemberWorkspace view="feedback" />);
    expect(await screen.findByRole("heading", { name: "今日模板反馈" })).toBeTruthy();
    expect(screen.getByText("4 / 6")).toBeTruthy();
    expect(screen.getByText("Day 1 / 7")).toBeTruthy();
    view.unmount();
    vi.clearAllMocks();

    view = render(<MemberWorkspace view="today" />);
    await screen.findByRole("heading", { name: "今天只完成 3+3" });
    expect(screen.getByText(/同一天不能重复提交/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /开始 Day 1 打卡/ })).toBeNull();
    expect(screen.getByText("共完成 4 项")).toBeTruthy();
    expect(screen.getByText("模板反馈")).toBeTruthy();
    expect(screen.queryByText("晚上一直刷手机")).toBeNull();
    await user.click(screen.getByRole("button", { name: "重新测评" }));
    expect(router.push).toHaveBeenCalledWith("/member/onboarding");
    view.unmount();
    vi.clearAllMocks();

    view = render(<MemberWorkspace view="onboarding" />);
    await screen.findByRole("heading", { name: "先了解今天的起点" });
    await user.click(screen.getByText("有想法，却迟迟没有开始表达"));
    await user.click(screen.getByRole("button", { name: "生成我的 3+3 今日任务" }));
    stored = parseMemberProgramState(window.localStorage.getItem(memberStorageKey));
    expect(stored?.checkins).toEqual([]);
    expect(stored?.assessment.concern).toBe("expression");
    view.unmount();
    vi.clearAllMocks();

    view = render(<MemberWorkspace view="today" />);
    await screen.findByRole("heading", { name: "今天只完成 3+3" });
    await user.click(screen.getByRole("button", { name: "重置演示" }));
    expect(window.localStorage.getItem(memberStorageKey)).toBeNull();
    expect(router.push).toHaveBeenCalledWith("/member/onboarding");
    view.unmount();
  });

  it("shows account-local demo controls only with the hidden query and unlocks days without backfill", async () => {
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
    await screen.findByRole("heading", { name: "今天只完成 3+3" });
    await user.click(screen.getByText("演示工具"));
    await user.click(screen.getByRole("button", { name: "模拟进入下一天" }));
    await waitFor(() => expect(screen.getByText("Day 2 / 7")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "模拟进入下一天" }));
    await waitFor(() => expect(screen.getByText("Day 3 / 7")).toBeTruthy());

    const missedDay = screen.getByRole("button", { name: /Day 2，.*未记录/ });
    expect(missedDay.hasAttribute("disabled")).toBe(false);
    await user.click(missedDay);
    expect(screen.getByText("这一天没有记录，不影响你继续旅程。")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Day 4，.*未解锁/ }).hasAttribute("disabled")).toBe(
      true,
    );
    expect(screen.getByRole("button", { name: "开始 Day 3 打卡" })).toBeTruthy();

    const stored = parseMemberProgramState(window.localStorage.getItem(memberStorageKey));
    expect(stored?.demoDayOffset).toBe(2);
    expect(stored?.checkins.map((checkin) => checkin.day)).toEqual([1]);
    expect(parseMemberProgramState(window.localStorage.getItem(otherMemberKey))?.demoDayOffset).toBe(
      0,
    );

    await user.click(screen.getByRole("button", { name: "重置模拟日期" }));
    await waitFor(() => expect(screen.getByText("Day 1 / 7")).toBeTruthy());
    expect(parseMemberProgramState(window.localStorage.getItem(memberStorageKey))?.demoDayOffset).toBe(
      0,
    );
  });

  it("redirects a repeated same-day check-in and keeps non-member roles out", async () => {
    seedSession();
    seedDayOneCheckin();
    let view = render(<MemberWorkspace view="checkin" />);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/member/today"));
    expect(screen.queryByRole("heading", { name: "Day 1 今日打卡" })).toBeNull();
    view.unmount();
    vi.clearAllMocks();

    window.localStorage.clear();
    seedSession(["owner"]);
    view = render(<MemberWorkspace view="today" />);
    expect(await screen.findByRole("heading", { name: "当前账号没有会员权限" })).toBeTruthy();
    expect(screen.queryByText("今天只完成 3+3")).toBeNull();
    expect(window.localStorage.getItem(memberStorageKey)).toBeNull();
    view.unmount();
  });
});
