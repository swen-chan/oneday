// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminManagement } from "./AdminManagement";
import { defaultAdminAccounts, digestDemoPassword } from "./adminAccounts";

afterEach(() => cleanup());

describe("administrator management form", () => {
  it("shows username, password and hotel scope without a role chooser", async () => {
    const user = userEvent.setup();
    const onAccountsChange = vi.fn();
    render(
      <AdminManagement
        brandId="brand-test"
        isOwner
        accounts={defaultAdminAccounts("brand-test")}
        onAccountsChange={onAccountsChange}
      />,
    );

    expect(screen.getByRole("heading", { name: "管理员权限" })).toBeTruthy();
    expect(screen.getByLabelText("用户名")).toBeTruthy();
    expect(screen.getByLabelText("初始密码")).toBeTruthy();
    expect(screen.queryByLabelText("角色")).toBeNull();
    expect(screen.getByLabelText("无名初酒店")).toBeTruthy();
    expect(screen.getByLabelText("君亭酒店")).toBeTruthy();

    await user.type(screen.getByLabelText("用户名"), "双店管理员");
    await user.type(screen.getByLabelText("邮箱"), "both@oneday.demo");
    await user.type(screen.getByLabelText("初始密码"), "two-hotel-password");
    await user.click(screen.getByLabelText("君亭酒店"));
    await user.click(screen.getByRole("button", { name: "新增管理员" }));

    const nextAccounts = onAccountsChange.mock.calls[0][0];
    const created = nextAccounts.at(-1);
    expect(created.username).toBe("双店管理员");
    expect(created.role).toBe("operator");
    expect(created.allowedHotelIds).toEqual(["wumingchu", "junting"]);
    expect(created.passwordDigest).toBe(digestDemoPassword("two-hotel-password"));
    expect(JSON.stringify(created)).not.toContain("two-hotel-password");
  });

  it("does not expose the management form to an administrator", () => {
    render(
      <AdminManagement
        brandId="brand-test"
        isOwner={false}
        accounts={defaultAdminAccounts("brand-test")}
        onAccountsChange={vi.fn()}
      />,
    );
    expect(screen.getByText("仅品牌负责人可管理管理员")).toBeTruthy();
    expect(screen.queryByLabelText("用户名")).toBeNull();
    expect(screen.queryByLabelText("初始密码")).toBeNull();
  });
});
