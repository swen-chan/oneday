"use client";

import Image from "next/image";
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import {
  createLocalMemberSquareProvider,
  memberSquareMaxCommentLength,
  memberSquareMaxImageBytes,
  memberSquareMaxNoteLength,
  type MemberSquarePost,
  type MemberSquareProvider,
  type MemberSquareSnapshot,
} from "./memberSquareStore";
import type { DemoSessionLike } from "./memberPlan";

function formatSquareTime(value: string, now = new Date()) {
  const elapsed = Math.max(0, now.getTime() - Date.parse(value));
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  if (hours < 48) return "昨天";
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(
    new Date(value),
  );
}

function readImageDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    if (!/^image\/(?:png|jpeg|webp)$/.test(file.type)) {
      reject(new Error("IMAGE_TYPE"));
      return;
    }
    if (file.size > memberSquareMaxImageBytes) {
      reject(new Error("IMAGE_SIZE"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("IMAGE_READ"));
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("IMAGE_READ"));
    reader.readAsDataURL(file);
  });
}

function CheckinPost({ post }: { post: MemberSquarePost }) {
  if (!post.checkin) return null;
  return (
    <section
      aria-label={`Day ${post.checkin.day} 公开打卡摘要`}
      className="mt-4 overflow-hidden rounded-[1.75rem] border border-brand/20 bg-[linear-gradient(145deg,#edf3f1_0%,#f8f4eb_100%)] p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium tracking-[0.18em] text-brand">
            ONE DAY · DAY {post.checkin.day}
          </p>
          <p className="mt-3 text-3xl font-bold">
            {post.checkin.completedCount} / {post.checkin.totalTasks}
          </p>
          <p className="mt-1 text-xs text-ink-muted">{post.checkin.dateLabel}点亮的行动</p>
        </div>
        <span className="rounded-full bg-white/75 px-3 py-2 text-xs text-brand">今日海报</span>
      </div>
      <p className="mt-5 text-base font-semibold leading-7">{post.checkin.encouragement}</p>
      {post.checkin.visibleTaskTitles.length ? (
        <div className="mt-4 border-t border-white/80 pt-4">
          <p className="text-xs font-medium text-brand">本人选择公开的行动</p>
          <ul className="mt-2 grid gap-2 text-xs leading-5 text-ink-soft">
            {post.checkin.visibleTaskTitles.map((title) => (
              <li key={title} className="rounded-2xl bg-white/65 px-3 py-2">
                ✓ {title}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-xs text-ink-muted">具体任务保持私密，仅公开完成数量。</p>
      )}
    </section>
  );
}

function SquarePostCard({
  post,
  commentDraft,
  deletePending,
  onCommentDraftChange,
  onToggleLike,
  onAddComment,
  onDeleteComment,
  onToggleComments,
  onRequestDelete,
  onCancelDelete,
}: {
  post: MemberSquarePost;
  commentDraft: string;
  deletePending: boolean;
  onCommentDraftChange: (value: string) => void;
  onToggleLike: () => void;
  onAddComment: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteComment: (commentId: string) => void;
  onToggleComments: () => void;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
}) {
  return (
    <article className="rounded-[2rem] border border-line bg-surface p-5 shadow-sm sm:p-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xl"
          >
            {post.author.avatar}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-bold">{post.author.displayName}</p>
              {post.own ? (
                <span className="rounded-full bg-brand-soft px-2 py-1 text-[10px] text-brand">我</span>
              ) : null}
              {post.synthetic ? (
                <span className="rounded-full bg-warn-soft px-2 py-1 text-[10px] text-warn">
                  合成成员
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-[11px] text-ink-muted">
              {formatSquareTime(post.createdAt)} · {post.kind === "checkin" ? "今日打卡" : "笔记"}
            </p>
          </div>
        </div>
        {post.own ? (
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onToggleComments}
              className="text-[11px] text-ink-muted hover:text-brand"
            >
              {post.commentsEnabled ? "关闭评论" : "开启评论"}
            </button>
            {!deletePending ? (
              <button
                type="button"
                onClick={onRequestDelete}
                className="text-[11px] text-ink-muted hover:text-warn"
              >
                删除
              </button>
            ) : (
              <span className="flex items-center gap-2 text-[11px]">
                <button type="button" onClick={onRequestDelete} className="font-medium text-warn">
                  确认删除
                </button>
                <button type="button" onClick={onCancelDelete} className="text-ink-muted">
                  取消
                </button>
              </span>
            )}
          </div>
        ) : null}
      </header>

      {post.body ? <p className="mt-4 whitespace-pre-wrap text-sm leading-7">{post.body}</p> : null}
      <CheckinPost post={post} />
      {post.imageDataUrl ? (
        <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-3xl bg-bg">
          <Image
            src={post.imageDataUrl}
            alt="成员笔记配图"
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 680px"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="mt-5 flex items-center gap-4 border-t border-line pt-4 text-xs">
        <button
          type="button"
          aria-pressed={post.liked}
          onClick={onToggleLike}
          className={`rounded-full px-3 py-2 transition ${
            post.liked ? "bg-brand text-white" : "bg-bg text-ink-soft hover:text-brand"
          }`}
        >
          {post.liked ? "已赞" : "赞"} · {post.likeCount}
        </button>
        <span className="text-ink-muted">评论 · {post.comments.length}</span>
      </div>

      {post.comments.length ? (
        <ul className="mt-4 grid gap-3" aria-label="评论列表">
          {post.comments.map((comment) => (
            <li key={comment.id} className="rounded-2xl bg-bg px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium">
                    {comment.author.avatar} {comment.author.displayName}
                    {comment.synthetic ? (
                      <span className="ml-2 text-[10px] font-normal text-warn">合成</span>
                    ) : null}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-xs leading-6 text-ink-soft">
                    {comment.body}
                  </p>
                </div>
                {comment.own ? (
                  <button
                    type="button"
                    onClick={() => onDeleteComment(comment.id)}
                    className="shrink-0 text-[10px] text-ink-muted hover:text-warn"
                  >
                    删除
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {post.commentsEnabled ? (
        <form onSubmit={onAddComment} className="mt-4 flex gap-2">
          <label className="sr-only" htmlFor={`comment-${post.id}`}>
            评论 {post.author.displayName} 的帖子
          </label>
          <input
            id={`comment-${post.id}`}
            value={commentDraft}
            maxLength={memberSquareMaxCommentLength}
            onChange={(event) => onCommentDraftChange(event.target.value)}
            placeholder="写一句友善的回应"
            className="min-w-0 flex-1 rounded-full border border-line bg-bg px-4 py-2.5 text-xs outline-none focus:border-brand"
          />
          <button
            type="submit"
            disabled={!commentDraft.trim()}
            className="rounded-full bg-brand px-4 py-2.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            评论
          </button>
        </form>
      ) : (
        <p className="mt-4 rounded-2xl bg-bg px-4 py-3 text-xs text-ink-muted">作者已关闭评论。</p>
      )}
    </article>
  );
}

export function MemberSquare({ session }: { session: DemoSessionLike }) {
  const [provider, setProvider] = useState<MemberSquareProvider | null>(null);
  const [snapshot, setSnapshot] = useState<MemberSquareSnapshot | null>(null);
  const [note, setNote] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>();
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const nextProvider = createLocalMemberSquareProvider(window.localStorage);
    setProvider(nextProvider);
    setSnapshot(nextProvider.snapshot(session.email));
    const published = new URLSearchParams(window.location.search).get("published");
    if (published === "checkin") setNotice("今日打卡已发布到这个演示广场。");
  }, [session.email]);

  const update = (action: (activeProvider: MemberSquareProvider) => MemberSquareSnapshot) => {
    if (!provider) return;
    try {
      setSnapshot(action(provider));
      setNotice(null);
    } catch {
      setNotice("本地保存失败，请删除较大的图片或稍后重试。");
    }
  };

  const chooseImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setImageDataUrl(await readImageDataUrl(file));
      setNotice("已加入一张仅保存在当前浏览器的图片。");
    } catch (error) {
      setImageDataUrl(undefined);
      setNotice(
        error instanceof Error && error.message === "IMAGE_SIZE"
          ? `图片需小于 ${Math.floor(memberSquareMaxImageBytes / 1024)}KB。`
          : "仅支持 PNG、JPG 或 WebP 图片。",
      );
    } finally {
      event.target.value = "";
    }
  };

  const publishNote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!provider || (!note.trim() && !imageDataUrl)) return;
    try {
      setSnapshot(
        provider.publishNote(session.email, {
          body: note,
          imageDataUrl,
          commentsEnabled,
        }),
      );
      setNote("");
      setImageDataUrl(undefined);
      setCommentsEnabled(true);
      setNotice("笔记已发布到演示广场，仅当前账号与浏览器可见。可在帖子右上角删除。 ");
    } catch {
      setNotice("发布失败，请缩短内容、移除图片后重试。");
    }
  };

  if (!snapshot) {
    return (
      <div className="rounded-3xl border border-line bg-surface p-6 text-sm text-ink-soft">
        正在准备演示广场…
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
      <div className="grid gap-5 lg:sticky lg:top-6">
        <section className="rounded-[2rem] border border-warn/25 bg-warn-soft p-5">
          <p className="text-xs font-bold tracking-[0.14em] text-warn">演示广场 · 合成内容</p>
          <h2 className="mt-2 text-lg font-bold">仅当前账号与浏览器</h2>
          <p className="mt-2 text-xs leading-6 text-ink-soft">
            这里不是实时多人社区。合成成员、帖子与基础互动都用于展示；你发布、点赞和评论的内容只保存在当前账号的这个浏览器里，其他账号看不到。
          </p>
        </section>

        <section className="rounded-[2rem] border border-line bg-surface p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-xl">
              {snapshot.viewer.avatar}
            </span>
            <div>
              <p className="text-xs text-ink-muted">你在广场显示为</p>
              <p className="mt-1 text-sm font-bold">{snapshot.viewer.displayName}</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-5 text-ink-muted">
            广场不显示登录邮箱、内部账号标签或私密打卡补充文字。
          </p>

          <form onSubmit={publishNote} className="mt-5 border-t border-line pt-5">
            <label className="text-sm font-bold" htmlFor="member-square-note">
              发布一篇笔记
            </label>
            <textarea
              id="member-square-note"
              value={note}
              maxLength={memberSquareMaxNoteLength}
              onChange={(event) => setNote(event.target.value)}
              placeholder="记录今天一个愿意公开的小发现…"
              className="mt-3 min-h-32 w-full resize-y rounded-3xl border border-line bg-bg px-4 py-3 text-sm leading-6 outline-none focus:border-brand"
            />
            <p className="mt-1 text-right text-[11px] text-ink-muted">
              {note.length} / {memberSquareMaxNoteLength}
            </p>

            {imageDataUrl ? (
              <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-3xl bg-bg">
                <Image
                  src={imageDataUrl}
                  alt="待发布笔记配图"
                  fill
                  unoptimized
                  sizes="420px"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImageDataUrl(undefined)}
                  className="absolute right-3 top-3 rounded-full bg-ink/70 px-3 py-2 text-[11px] text-white"
                >
                  移除图片
                </button>
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <label className="cursor-pointer rounded-full border border-line px-4 py-2.5 text-xs text-ink-soft hover:border-brand hover:text-brand">
                添加图片
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => void chooseImage(event)}
                  className="sr-only"
                />
              </label>
              <span className="text-[10px] text-ink-muted">
                PNG / JPG / WebP，≤ {Math.floor(memberSquareMaxImageBytes / 1024)}KB
              </span>
            </div>
            <label className="mt-4 flex items-center gap-2 text-xs text-ink-soft">
              <input
                type="checkbox"
                checked={commentsEnabled}
                onChange={(event) => setCommentsEnabled(event.target.checked)}
                className="h-4 w-4 accent-brand"
              />
              允许评论
            </label>
            <button
              type="submit"
              disabled={!note.trim() && !imageDataUrl}
              className="mt-5 w-full rounded-full bg-brand px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              发布笔记
            </button>
          </form>
          {notice ? (
            <p role="status" className="mt-4 rounded-2xl bg-bg px-4 py-3 text-xs leading-5 text-ink-muted">
              {notice}
            </p>
          ) : null}
        </section>
      </div>

      <section aria-labelledby="member-square-feed-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 px-1">
          <div>
            <p className="text-sm font-medium text-brand">同一社群</p>
            <h2 id="member-square-feed-title" className="mt-1 text-2xl font-bold">
              广场动态
            </h2>
          </div>
          <span className="rounded-full bg-surface px-4 py-2 text-xs text-ink-muted">
            按时间排序 · 无排名
          </span>
        </div>
        <div className="grid gap-4">
          {snapshot.posts.map((post) => (
            <SquarePostCard
              key={post.id}
              post={post}
              commentDraft={commentDrafts[post.id] ?? ""}
              deletePending={deletePendingId === post.id}
              onCommentDraftChange={(value) =>
                setCommentDrafts((current) => ({ ...current, [post.id]: value }))
              }
              onToggleLike={() =>
                update((activeProvider) => activeProvider.toggleLike(session.email, post.id))
              }
              onAddComment={(event) => {
                event.preventDefault();
                const body = commentDrafts[post.id] ?? "";
                if (!body.trim()) return;
                update((activeProvider) =>
                  activeProvider.addComment(session.email, post.id, body),
                );
                setCommentDrafts((current) => ({ ...current, [post.id]: "" }));
              }}
              onDeleteComment={(commentId) =>
                update((activeProvider) =>
                  activeProvider.deleteOwnComment(session.email, commentId),
                )
              }
              onToggleComments={() =>
                update((activeProvider) =>
                  activeProvider.setOwnPostCommentsEnabled(
                    session.email,
                    post.id,
                    !post.commentsEnabled,
                  ),
                )
              }
              onRequestDelete={() => {
                if (deletePendingId !== post.id) {
                  setDeletePendingId(post.id);
                  return;
                }
                update((activeProvider) =>
                  activeProvider.deleteOwnPost(session.email, post.id),
                );
                setDeletePendingId(null);
              }}
              onCancelDelete={() => setDeletePendingId(null)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
