"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildSyntheticMemberProfile,
  type HealthMemberInput,
} from "./memberProfiles";
import { buildMemberOutreachDraft } from "./memberOutreach";
import { copyTextToClipboard } from "./copyText";

export function MemberDetailDialog({
  member,
  referenceDate,
  onClose,
}: {
  member: HealthMemberInput;
  referenceDate: string;
  onClose: () => void;
}) {
  const profile = useMemo(
    () => buildSyntheticMemberProfile(member, referenceDate),
    [member, referenceDate],
  );
  const [outreachVisible, setOutreachVisible] = useState(false);
  const [regenerateCount, setRegenerateCount] = useState(0);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const outreach = useMemo(
    () => buildMemberOutreachDraft(member, profile, referenceDate, regenerateCount),
    [member, profile, referenceDate, regenerateCount],
  );

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  useEffect(() => {
    setOutreachVisible(false);
    setRegenerateCount(0);
    setCopyStatus("idle");
  }, [member.alias]);

  const progress = Math.round(
    (profile.currentActivity.day / profile.currentActivity.totalDays) * 100,
  );

  const copyOutreach = async () => {
    const copied = await copyTextToClipboard(outreach.message);
    setCopyStatus(copied ? "copied" : "failed");
  };

  return (
    <div
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 px-4 py-8 backdrop-blur-sm"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-detail-title"
        className="max-h-full w-full max-w-2xl overflow-y-auto rounded-3xl border border-line bg-surface p-6 shadow-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line pb-5">
          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-brand">MEMBER PROFILE</p>
            <h2 id="member-detail-title" className="mt-2 text-2xl font-bold">
              {profile.displayName}
            </h2>
            <p className="mt-1 text-xs text-ink-muted">合成演示档案 · 不代表 C 端实时回写</p>
          </div>
          <button
            type="button"
            aria-label="关闭学员档案"
            onClick={onClose}
            className="rounded-full border border-line px-3 py-2 text-xs text-ink-muted transition hover:border-brand hover:text-brand"
          >
            关闭
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            ["会员阶段", profile.memberStage],
            ["加入时间", profile.joinedAt],
            ["当前关注", profile.currentFocus],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-bg p-4">
              <p className="text-xs text-ink-muted">{label}</p>
              <p className="mt-2 text-sm font-bold">{value}</p>
            </div>
          ))}
        </div>

        <section className="mt-6">
          <h3 className="text-sm font-bold">参加过的活动</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.completedActivities.map((activity) => (
              <span
                key={activity.name}
                className="rounded-full border border-line bg-white px-3 py-2 text-xs text-ink-soft"
              >
                {activity.name}{activity.times > 1 ? ` × ${activity.times}` : ""}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-brand/20 bg-brand-soft p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-brand">
                {profile.activityLayer === "active" ? "正在进行" : "当前登记"}
              </p>
              <h3 className="mt-1 text-base font-bold">{profile.currentActivity.name}</h3>
            </div>
            <span className="rounded-full bg-white/70 px-3 py-2 text-xs text-brand">
              Day {profile.currentActivity.day} / {profile.currentActivity.totalDays}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label={`${profile.currentActivity.name}进度`}
            aria-valuemin={0}
            aria-valuemax={profile.currentActivity.totalDays}
            aria-valuenow={profile.currentActivity.day}
            className="mt-4 h-2 overflow-hidden rounded-full bg-white"
          >
            <div className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-line p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold">今日打卡</h3>
            <span
              className={`rounded-full px-3 py-1.5 text-xs ${
                profile.todayCheckin.status === "checked"
                  ? "bg-brand-soft text-brand"
                  : "bg-warn-soft text-warn"
              }`}
            >
              {profile.todayCheckin.status === "checked"
                ? `已打卡 · ${profile.todayCheckin.completedCount}/6`
                : "未打卡"}
            </span>
          </div>
          {profile.todayCheckin.feedback ? (
            <blockquote className="mt-4 rounded-2xl bg-bg px-4 py-4 text-sm leading-7 text-ink-soft">
              “{profile.todayCheckin.feedback}”
            </blockquote>
          ) : (
            <p className="mt-3 text-sm text-ink-muted">今天尚未提交 3+3 打卡记录。</p>
          )}
        </section>

        <section className="mt-6 rounded-3xl border border-brand/20 bg-brand-soft p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-brand">运营话术</p>
              <h3 className="mt-1 text-base font-bold">{outreach.statusLabel}</h3>
              <p className="mt-1 text-xs text-ink-muted">
                结构化演示档案生成 · 需人工确认复制 · 不会自动发送
              </p>
            </div>
            {!outreachVisible && (
              <button
                type="button"
                onClick={() => {
                  setOutreachVisible(true);
                  setCopyStatus("idle");
                }}
                className="rounded-full bg-brand px-4 py-2 text-xs font-medium text-white"
              >
                {outreach.actionLabel}
              </button>
            )}
          </div>

          {outreachVisible && (
            <div className="mt-4">
              <div aria-label="话术生成依据" className="flex flex-wrap gap-2">
                {outreach.basis.map((basis) => (
                  <span
                    key={basis}
                    className="rounded-full border border-brand/15 bg-white/80 px-3 py-1.5 text-xs text-ink-muted"
                  >
                    {basis}
                  </span>
                ))}
              </div>
              <blockquote
                data-testid="member-outreach-message"
                className="mt-4 rounded-2xl bg-white px-4 py-4 text-sm leading-7 text-ink-soft"
              >
                {outreach.message}
              </blockquote>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void copyOutreach()}
                  className="rounded-full bg-brand px-4 py-2 text-xs font-medium text-white"
                >
                  {copyStatus === "copied" ? "已复制" : "复制话术"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRegenerateCount((count) => count + 1);
                    setCopyStatus("idle");
                  }}
                  className="rounded-full border border-brand bg-white px-4 py-2 text-xs font-medium text-brand"
                >
                  重新生成
                </button>
                {copyStatus === "failed" && (
                  <span className="text-xs text-warn">复制失败，请手动选择文字复制</span>
                )}
              </div>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
