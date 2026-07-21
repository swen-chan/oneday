// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
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
  layers: { active: [], cooling: [], sleeping: [] },
  summary: {
    total: 0,
    activeCount: 0,
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
    expect(screen.getByText("仅品牌负责人可管理管理员")).toBeTruthy();
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
