import { describe, expect, it } from "vitest";
import {
  createLocalMemberSquareProvider,
  memberSquareStorageKey,
  memberSquareViewer,
  parseMemberSquareState,
} from "./memberSquareStore";

function createMemoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
    values,
  };
}

function createProvider(storage = createMemoryStorage()) {
  let id = 0;
  const provider = createLocalMemberSquareProvider(storage, {
    now: () => new Date("2026-07-22T02:00:00.000Z"),
    createId: () => String(++id).padStart(2, "0"),
  });
  return { provider, storage };
}

describe("local member square provider", () => {
  it("shows twelve transparent synthetic posts and a deterministic alias without exposing identity", () => {
    const { provider } = createProvider();
    const identity = "member@oneday.demo";
    const snapshot = provider.snapshot(identity);

    expect(snapshot.posts).toHaveLength(12);
    expect(snapshot.posts.every((post) => post.synthetic)).toBe(true);
    expect(snapshot.posts.every((post) => post.author.synthetic)).toBe(true);
    expect(snapshot.viewer).toEqual(memberSquareViewer(identity));
    expect(snapshot.viewer.displayName).not.toContain("member");
    expect(snapshot.viewer.displayName).not.toContain("@oneday.demo");
    expect(memberSquareStorageKey(identity)).not.toContain(identity);
  });

  it("keeps publishing, likes, comments, comment controls, and deletion account-local", () => {
    const { provider } = createProvider();
    const firstIdentity = "first-member@oneday.demo";
    const secondIdentity = "second-member@oneday.demo";

    let first = provider.publishNote(firstIdentity, {
      body: "这是我愿意公开的一条笔记。",
      commentsEnabled: true,
    });
    const ownPost = first.posts.find((post) => post.own)!;
    expect(ownPost.body).toBe("这是我愿意公开的一条笔记。");
    expect(provider.snapshot(secondIdentity).posts.some((post) => post.own)).toBe(false);

    first = provider.toggleLike(firstIdentity, ownPost.id);
    expect(first.posts.find((post) => post.id === ownPost.id)).toMatchObject({
      liked: true,
      likeCount: 1,
    });
    first = provider.toggleLike(firstIdentity, ownPost.id);
    expect(first.posts.find((post) => post.id === ownPost.id)).toMatchObject({
      liked: false,
      likeCount: 0,
    });

    first = provider.addComment(firstIdentity, ownPost.id, "给自己留一句友善回应。");
    const ownComment = first.posts.find((post) => post.id === ownPost.id)!.comments[0];
    expect(ownComment).toMatchObject({ body: "给自己留一句友善回应。", own: true });
    first = provider.deleteOwnComment(firstIdentity, ownComment.id);
    expect(first.posts.find((post) => post.id === ownPost.id)!.comments).toEqual([]);

    first = provider.setOwnPostCommentsEnabled(firstIdentity, ownPost.id, false);
    expect(first.posts.find((post) => post.id === ownPost.id)!.commentsEnabled).toBe(false);
    expect(() => provider.addComment(firstIdentity, ownPost.id, "不能发送")).toThrow(
      "COMMENTS_DISABLED",
    );

    first = provider.deleteOwnPost(firstIdentity, ownPost.id);
    expect(first.posts.some((post) => post.id === ownPost.id)).toBe(false);
    expect(provider.snapshot(secondIdentity).posts).toHaveLength(12);
  });

  it("publishes only the explicit check-in summary and selected task titles", () => {
    const { provider, storage } = createProvider();
    const identity = "member@oneday.demo";
    const privateNote = "这是绝不能进入广场的私密补充原文";

    const snapshot = provider.publishCheckin(identity, {
      sourceKey: "checkin:2026-07-22",
      day: 3,
      dateLabel: "7月22日",
      completedCount: 4,
      totalTasks: 6,
      encouragement: "今天的四个行动已经留下痕迹。",
      visibleTaskTitles: ["本人主动选择公开的任务"],
    });
    const post = snapshot.posts.find((item) => item.own)!;

    expect(post.kind).toBe("checkin");
    expect(post.checkin).toEqual({
      day: 3,
      dateLabel: "7月22日",
      completedCount: 4,
      totalTasks: 6,
      encouragement: "今天的四个行动已经留下痕迹。",
      visibleTaskTitles: ["本人主动选择公开的任务"],
    });
    const raw = storage.getItem(memberSquareStorageKey(identity));
    expect(raw).not.toContain(privateNote);
    expect(raw).not.toContain(identity);

    const republished = provider.publishCheckin(identity, {
      sourceKey: "checkin:2026-07-22",
      day: 3,
      dateLabel: "7月22日",
      completedCount: 4,
      totalTasks: 6,
      encouragement: "今天的四个行动已经留下痕迹。",
      visibleTaskTitles: [],
    });
    expect(republished.posts.filter((item) => item.own)).toHaveLength(1);
    expect(republished.posts.find((item) => item.own)?.checkin?.visibleTaskTitles).toEqual([]);
  });

  it("self-heals malformed local data instead of rendering unsafe fields", () => {
    const parsed = parseMemberSquareState(
      JSON.stringify({
        version: 1,
        posts: [
          {
            id: "bad",
            kind: "note",
            body: "",
            imageDataUrl: "javascript:alert(1)",
            createdAt: "not-a-date",
            commentsEnabled: true,
          },
        ],
        likedPostIds: ["missing"],
        comments: [{ id: "bad", postId: "missing", body: "x", createdAt: "bad" }],
      }),
    );

    expect(parsed.posts).toEqual([]);
    expect(parsed.likedPostIds).toEqual([]);
    expect(parsed.comments).toEqual([]);
  });
});
