// @vitest-environment jsdom

import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoleRoutedDemo } from "../app/page";
import {
  adminAccountsStorageKey,
  defaultAdminAccounts,
  digestDemoPassword,
} from "./adminAccounts";

const router = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

const brand = {
  id: "brand-test",
  name: "JING 疗愈",
  industry: "疗愈个人 IP",
  tagline: "一对一陪伴 + 月度主题营",
  defaultTheme: "睡眠修复 · 深度休息",
  groupId: "group-test",
  memberCount: 40,
};

const dashboard = {
  groupId: "group-test",
  groupName: "JING 创始会员群",
  referenceDate: "2026-07-21T00:00:00.000Z",
  layers: {
    active: [
      {
        alias: "member-active",
        displayName: "松林会员",
        lastActiveAt: "2026-07-21T00:00:00.000Z",
        messageCount: 7,
      },
    ],
    cooling: [],
    sleeping: [],
  },
  summary: {
    total: 1,
    activeCount: 1,
    coolingCount: 0,
    sleepingCount: 0,
    activeRatio: 0,
    healthScore: 0,
  },
};

function response(body: unknown) {
  return { json: async () => body } as Response;
}

describe("console login and role routing", () => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/api/demo/seed")) return response({ brands: [brand] });
    if (url.endsWith("/api/brands")) return response({ brands: [brand] });
    if (url.endsWith("/api/groups/group-test/dashboard")) return response(dashboard);
    throw new Error(`Unexpected request: ${url}`);
  });

  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("logs a default hotel administrator into only its authorized hotel", async () => {
    const loginPassword = "test-only-password";
    const accounts = defaultAdminAccounts(brand.id).map((account) => ({
      ...account,
      passwordDigest: digestDemoPassword(loginPassword),
    }));
    window.localStorage.setItem(
      adminAccountsStorageKey(brand.id),
      JSON.stringify(accounts),
    );
    const user = userEvent.setup();
    const loginView = render(<RoleRoutedDemo initialWorkspace="login" />);
    const submitLogin = screen
      .getAllByRole("button", { name: "登录" })
      .find((button) => button.getAttribute("type") === "submit") as HTMLButtonElement;

    await waitFor(() =>
      expect(submitLogin.disabled).toBe(false),
    );
    await user.type(screen.getByLabelText("邮箱"), "wumingchu@oneday.demo");
    await user.type(screen.getByLabelText("密码"), loginPassword);
    await user.click(submitLogin);

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/console"));
    const storedSession = JSON.parse(
      window.localStorage.getItem("oneday-demo-role-session") ?? "null",
    );
    expect(storedSession.allowedHotelIds).toEqual(["wumingchu"]);
    expect(storedSession.roles).toEqual(["operator"]);

    loginView.unmount();
    render(<RoleRoutedDemo initialWorkspace="console" />);
    expect(await screen.findByRole("heading", { name: "经营总览" })).toBeTruthy();
    expect(screen.getAllByText("无名初酒店").length).toBeGreaterThan(0);
    expect(screen.queryByRole("option", { name: "君亭酒店" })).toBeNull();
    expect(screen.queryByRole("button", { name: "管理员权限" })).toBeNull();
    const healthMember = (await screen.findByText("松林会员")).closest("li");
    expect(healthMember).not.toBeNull();
    expect(within(healthMember as HTMLLIElement).getByText("今天")).toBeTruthy();
    expect(within(healthMember as HTMLLIElement).queryByText(/条/)).toBeNull();
    await user.click(screen.getByRole("button", { name: "查看松林会员详情" }));
    expect(await screen.findByRole("dialog", { name: "松林会员" })).toBeTruthy();
    expect(screen.getByText("参加过的活动")).toBeTruthy();
    expect(screen.getByText("正在进行")).toBeTruthy();
    expect(screen.getByText("今日打卡")).toBeTruthy();
    expect(screen.getByText(/不代表 C 端实时回写/)).toBeTruthy();
  });

  it("keeps administrator management behind the owner utility-bar dialog", async () => {
    window.localStorage.setItem(
      "oneday-demo-role-session",
      JSON.stringify({
        email: "jing@oneday.demo",
        label: "JING 负责人账号",
        roles: ["owner"],
        brandId: brand.id,
        brandName: brand.name,
        allowedHotelIds: ["wumingchu", "junting"],
      }),
    );
    const user = userEvent.setup();
    render(<RoleRoutedDemo initialWorkspace="console" />);

    expect(await screen.findByRole("heading", { name: "经营总览" })).toBeTruthy();
    const managementButton = screen.getByRole("button", { name: "管理员权限" });
    expect(screen.queryByLabelText("用户名")).toBeNull();
    await user.click(managementButton);

    expect(await screen.findByRole("dialog", { name: "管理员权限" })).toBeTruthy();
    expect(screen.getByLabelText("用户名")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "关闭管理员权限" }));
    expect(screen.queryByRole("dialog", { name: "管理员权限" })).toBeNull();
  });

  it("does not let a member session trigger the commercial or group dashboard", async () => {
    window.localStorage.setItem(
      "oneday-demo-role-session",
      JSON.stringify({
        email: "member@oneday.demo",
        label: "JING 会员账号",
        roles: ["member"],
      }),
    );
    render(<RoleRoutedDemo initialWorkspace="console" />);

    expect(
      await screen.findByRole("heading", { name: "当前账号没有品牌运营台权限" }),
    ).toBeTruthy();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(
      fetchMock.mock.calls.some(([input]) => String(input).includes("/dashboard")),
    ).toBe(false);
    expect(screen.queryByRole("heading", { name: "经营总览" })).toBeNull();
  });
});
