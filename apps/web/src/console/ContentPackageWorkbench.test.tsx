// @vitest-environment jsdom

import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContentPackageWorkbench } from "./ContentPackageWorkbench";

const apiPackage = {
  brandName: "JING",
  monthTheme: "服务包 · 睡眠修复",
  generatedBy: "template",
  days: [
    {
      dayIndex: 1,
      momentsPost: "朋友圈内容",
      groupTopic: "群话题内容",
      dmScript: "私信内容",
    },
  ],
  failedDays: [],
};

const brand = {
  id: "brand-a",
  name: "JING",
  industry: "健康生活",
  defaultTheme: "日常节律",
};

describe("content package workbench", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => apiPackage }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("saves a named snapshot, switches back to its original settings and copies a field", async () => {
    const user = userEvent.setup();
    render(
      <ContentPackageWorkbench
        brand={brand}
        accountId="owner@oneday.demo"
        apiBase="http://localhost:3210"
      />,
    );

    await user.click(screen.getByRole("button", { name: "生成 7 天内容包" }));
    expect(
      (await screen.findByTestId("content-package-result-title")).textContent,
    ).toContain("7 天陪跑包");
    await user.click(screen.getByRole("button", { name: "收藏" }));
    const nameInput = screen.getByLabelText("收藏名称");
    await user.clear(nameInput);
    await user.type(nameInput, "晨间收藏");
    await user.click(screen.getByRole("button", { name: "保存收藏" }));
    expect(await screen.findByText("晨间收藏")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "专业克制" }));
    await user.click(screen.getByRole("button", { name: /^私信/ }));
    await user.click(screen.getByRole("button", { name: "生成 7 天内容包" }));
    expect(await screen.findByText("输出渠道：一对一触达 · 语气：专业克制")).toBeTruthy();

    const favorites = screen.getByLabelText("内容包收藏列表");
    await user.click(
      within(favorites).getByRole("button", { name: /^晨间收藏 7 天/ }),
    );
    expect(screen.getByText("输出渠道：朋友圈 / 群 / 私信 · 语气：温柔陪伴")).toBeTruthy();
    expect(screen.getByRole("button", { name: "复制 DAY 1 朋友圈" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "复制 DAY 1 群话题" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "复制 DAY 1 私信话术" }));
    expect(await navigator.clipboard.readText()).toBe("私信内容");
  });

  it("reloads only the current account favorites and supports rename plus confirmed delete", async () => {
    const user = userEvent.setup();
    const first = render(
      <ContentPackageWorkbench
        brand={brand}
        accountId="owner@oneday.demo"
        apiBase="http://localhost:3210"
      />,
    );
    await user.click(screen.getByRole("button", { name: "生成 7 天内容包" }));
    await user.click(await screen.findByRole("button", { name: "收藏" }));
    await user.click(screen.getByRole("button", { name: "保存收藏" }));
    first.unmount();

    render(
      <ContentPackageWorkbench
        brand={brand}
        accountId="owner@oneday.demo"
        apiBase="http://localhost:3210"
      />,
    );
    await user.click(
      await screen.findByRole("button", { name: /重命名收藏 7 天陪跑包/ }),
    );
    const nameInput = screen.getByLabelText("收藏名称");
    await user.clear(nameInput);
    await user.type(nameInput, "每周固定包");
    await user.click(screen.getByRole("button", { name: "保存名称" }));
    expect(await screen.findByText("每周固定包")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /删除收藏 每周固定包/ }));
    await user.click(screen.getByRole("button", { name: /确认删除 每周固定包/ }));
    expect(await screen.findByText(/暂无收藏/)).toBeTruthy();

    cleanup();
    render(
      <ContentPackageWorkbench
        brand={brand}
        accountId="other@oneday.demo"
        apiBase="http://localhost:3210"
      />,
    );
    await waitFor(() => expect(screen.getByText(/暂无收藏/)).toBeTruthy());
  });
});
