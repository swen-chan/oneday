// @vitest-environment jsdom

import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MemberSquare } from "./MemberSquare";
import { memberSquareViewer } from "./memberSquareStore";
import type { DemoSessionLike } from "./memberPlan";

const firstSession: DemoSessionLike = {
  email: "first-member@oneday.demo",
  label: "JING 会员账号",
  roles: ["member"],
};

const secondSession: DemoSessionLike = {
  email: "second-member@oneday.demo",
  label: "JING 会员账号",
  roles: ["member"],
};

describe("member square interface", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, "", "/member/square");
  });

  afterEach(() => {
    cleanup();
  });

  it("runs the local note, like, comment, comment-control, and delete loop", async () => {
    const user = userEvent.setup();
    const noteBody = "今天先完成一个最小动作，再决定要不要继续。";
    const commentBody = "给这条记录留一句回应。";
    const viewer = memberSquareViewer(firstSession.email);
    const view = render(<MemberSquare session={firstSession} />);

    expect(await screen.findByText("演示广场 · 合成内容")).toBeTruthy();
    expect(screen.getAllByRole("article")).toHaveLength(12);
    expect(screen.getByText(viewer.displayName)).toBeTruthy();
    expect(screen.queryByText(firstSession.email)).toBeNull();

    await user.type(screen.getByRole("textbox", { name: "发布一篇笔记" }), noteBody);
    await user.click(screen.getByRole("button", { name: "发布笔记" }));
    expect(await screen.findByText(noteBody)).toBeTruthy();
    expect(screen.getAllByRole("article")).toHaveLength(13);

    const ownArticle = () => screen.getByText(noteBody).closest("article")!;
    await user.click(within(ownArticle()).getByRole("button", { name: "赞 · 0" }));
    expect(within(ownArticle()).getByRole("button", { name: "已赞 · 1" })).toBeTruthy();

    await user.type(
      within(ownArticle()).getByRole("textbox", {
        name: `评论 ${viewer.displayName} 的帖子`,
      }),
      commentBody,
    );
    await user.click(within(ownArticle()).getByRole("button", { name: "评论" }));
    expect(await screen.findByText(commentBody)).toBeTruthy();

    const commentRow = screen.getByText(commentBody).closest("li")!;
    await user.click(within(commentRow).getByRole("button", { name: "删除" }));
    await waitFor(() => expect(screen.queryByText(commentBody)).toBeNull());

    await user.click(within(ownArticle()).getByRole("button", { name: "关闭评论" }));
    expect(within(ownArticle()).getByText("作者已关闭评论。")).toBeTruthy();
    expect(
      within(ownArticle()).queryByRole("textbox", {
        name: `评论 ${viewer.displayName} 的帖子`,
      }),
    ).toBeNull();
    await user.click(within(ownArticle()).getByRole("button", { name: "开启评论" }));

    await user.click(within(ownArticle()).getByRole("button", { name: "删除" }));
    expect(within(ownArticle()).getByRole("button", { name: "确认删除" })).toBeTruthy();
    await user.click(within(ownArticle()).getByRole("button", { name: "确认删除" }));
    await waitFor(() => expect(screen.queryByText(noteBody)).toBeNull());
    expect(screen.getAllByRole("article")).toHaveLength(12);

    view.unmount();
    render(<MemberSquare session={secondSession} />);
    expect(await screen.findByText("演示广场 · 合成内容")).toBeTruthy();
    expect(screen.queryByText(noteBody)).toBeNull();
    expect(screen.getAllByRole("article")).toHaveLength(12);
  });
});
