// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemberWorkspace } from "./MemberWorkspace";
import {
  demoSessionStorageKey,
  memberProgramStorageKey,
  parseMemberProgramState,
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

function seedSession(roles: string[] = ["member"]) {
  window.localStorage.setItem(
    demoSessionStorageKey,
    JSON.stringify({
      email: roles.includes("member") ? memberEmail : "owner@oneday.demo",
      label: roles.includes("member") ? "JING 会员账号" : "JING 负责人账号",
      roles,
    }),
  );
}

describe("member workspace complete flow", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("routes a new member through onboarding, 3+3, check-in, feedback, refresh, reassessment, and reset", async () => {
    const user = userEvent.setup();
    seedSession();

    let view = render(<MemberWorkspace view="home" />);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/member/onboarding"));
    view.unmount();

    view = render(<MemberWorkspace view="onboarding" />);
    expect(await screen.findByRole("heading", { name: "先了解今天的起点" })).toBeTruthy();
    await user.click(screen.getByText("注意力常被许多事情拉走"));
    await user.click(screen.getByText("思绪比较分散，需要先收拢重点"));
    await user.click(screen.getByText("留下可以看见的小成果"));
    await user.click(screen.getByRole("button", { name: "生成我的 3+3 今日任务" }));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/member/today"));

    let stored = parseMemberProgramState(window.localStorage.getItem(memberStorageKey));
    expect(stored?.completedDays).toBe(0);
    expect(stored?.assessment).toEqual({
      concern: "focus",
      state: "scattered",
      goal: "visible-progress",
    });
    view.unmount();
    vi.clearAllMocks();

    view = render(<MemberWorkspace view="today" />);
    expect(await screen.findByRole("heading", { name: "今天只完成 3+3" })).toBeTruthy();
    expect(screen.getByText("做一张三项清空清单")).toBeTruthy();
    expect(screen.getByText("完成一轮 15 分钟单任务")).toBeTruthy();
    expect(screen.getByText("保存一份今日完成证据")).toBeTruthy();
    expect(screen.getAllByText(/^依据：/)).toHaveLength(6);
    await user.click(screen.getByRole("button", { name: "开始今日打卡" }));
    expect(router.push).toHaveBeenCalledWith("/member/checkin");
    view.unmount();
    vi.clearAllMocks();

    view = render(<MemberWorkspace view="checkin" />);
    expect(await screen.findByRole("heading", { name: "今日打卡" })).toBeTruthy();
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
    expect(stored?.completedDays).toBe(1);
    expect(stored?.lastCheckin?.completedTaskIds).toHaveLength(4);
    view.unmount();
    vi.clearAllMocks();

    view = render(<MemberWorkspace view="feedback" />);
    expect(await screen.findByRole("heading", { name: "今日模板反馈" })).toBeTruthy();
    expect(screen.getByText("4 / 6")).toBeTruthy();
    expect(screen.getByText("Day 1 / 14")).toBeTruthy();
    view.unmount();
    vi.clearAllMocks();

    view = render(<MemberWorkspace view="home" />);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/member/today"));
    view.unmount();
    vi.clearAllMocks();

    view = render(<MemberWorkspace view="today" />);
    await screen.findByRole("heading", { name: "今天只完成 3+3" });
    await user.click(screen.getByRole("button", { name: "重新测评" }));
    expect(router.push).toHaveBeenCalledWith("/member/onboarding");
    view.unmount();
    vi.clearAllMocks();

    view = render(<MemberWorkspace view="onboarding" />);
    await screen.findByRole("heading", { name: "先了解今天的起点" });
    await user.click(screen.getByText("有想法，却迟迟没有开始表达"));
    await user.click(screen.getByRole("button", { name: "生成我的 3+3 今日任务" }));
    stored = parseMemberProgramState(window.localStorage.getItem(memberStorageKey));
    expect(stored?.completedDays).toBe(0);
    expect(stored?.lastCheckin).toBeUndefined();
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

  it("keeps non-member roles out of member data and tasks", async () => {
    seedSession(["owner"]);
    render(<MemberWorkspace view="today" />);

    expect(await screen.findByRole("heading", { name: "当前账号没有会员权限" })).toBeTruthy();
    expect(screen.queryByText("今天只完成 3+3")).toBeNull();
    expect(window.localStorage.getItem(memberStorageKey)).toBeNull();
  });
});
