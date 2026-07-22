import type {
  HealthMemberInput,
  MemberActivityLayer,
  SyntheticMemberProfile,
} from "./memberProfiles";

export interface MemberOutreachDraft {
  layer: MemberActivityLayer;
  actionLabel: string;
  statusLabel: string;
  message: string;
  basis: string[];
  variant: number;
}

const dayMilliseconds = 24 * 60 * 60 * 1000;

function stableHash(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function daysSince(lastActiveAt: string, referenceDate: string) {
  return Math.max(
    0,
    Math.floor(
      (new Date(referenceDate).getTime() - new Date(lastActiveAt).getTime()) /
        dayMilliseconds,
    ),
  );
}

function recentActivityText(idleDays: number) {
  return idleDays === 0 ? "今天有互动" : `${idleDays} 天前有互动`;
}

export function buildMemberOutreachDraft(
  member: HealthMemberInput,
  profile: SyntheticMemberProfile,
  referenceDate: string,
  regenerateCount = 0,
): MemberOutreachDraft {
  const idleDays = daysSince(member.lastActiveAt, referenceDate);
  const completedActivity = profile.completedActivities[0];
  const variant = (stableHash(`${member.alias}:${profile.activityLayer}`) + regenerateCount) % 3;
  const sharedBasis = [
    `加入于 ${profile.joinedAt}`,
    recentActivityText(idleDays),
    `参加过：${completedActivity.name}`,
    `当前登记：${profile.currentActivity.name}`,
  ];

  if (profile.activityLayer === "active") {
    const activeMessages = [
      `${profile.displayName}，看到你在「${profile.currentActivity.name}」已经走到 Day ${profile.currentActivity.day}，这份稳定很珍贵。今天不用额外加码，照着现在的节奏继续就很好，我们明天也一起留一点时间给自己。`,
      `${profile.displayName}，你最近一直在认真参与「${profile.currentActivity.name}」，还记得你之前也完成过「${completedActivity.name}」。持续出现本身就是很好的积累，接下来保持舒服、可持续的节奏就好。`,
      `${profile.displayName}，谢谢你这段时间持续回来。你在「${profile.currentActivity.name}」已经来到 Day ${profile.currentActivity.day}/${profile.currentActivity.totalDays}，不用追求一次做很多，像现在这样一步一步走，就很值得肯定。`,
    ];
    return {
      layer: "active",
      actionLabel: "生成鼓励话术",
      statusLabel: "积极会员 · 鼓励保持",
      message: activeMessages[variant],
      basis: profile.todayCheckin.status === "checked"
        ? [...sharedBasis, `今日已打卡 ${profile.todayCheckin.completedCount}/6`]
        : sharedBasis,
      variant,
    };
  }

  if (profile.activityLayer === "cooling") {
    const coolingMessages = [
      `${profile.displayName}，最近一阵子没见到你，想轻轻问候一下。你之前参加过「${completedActivity.name}」，目前也登记在「${profile.currentActivity.name}」。不用追赶进度，如果愿意，今天只选一件最轻松的小事重新开始就好。`,
      `${profile.displayName}，想来问问你最近过得怎么样。你加入我们后已经体验过「${completedActivity.name}」，现在「${profile.currentActivity.name}」也还为你保留着。没有催促，如果这周愿意回来，告诉我你想从哪里接上就可以。`,
      `${profile.displayName}，有一段时间没有听到你的近况了。还记得你参加「${completedActivity.name}」时留下的那份投入。最近如果比较忙也没关系，等你方便时，我们可以从「${profile.currentActivity.name}」里一个很小的动作重新连接。`,
    ];
    return {
      layer: "cooling",
      actionLabel: "生成关怀话术",
      statusLabel: "降温会员 · 温和关怀",
      message: coolingMessages[variant],
      basis: sharedBasis,
      variant,
    };
  }

  const sleepingMessages = [
    `${profile.displayName}，有一阵子没见到你了，不是来催进度，只想问问最近怎么样。你从 ${profile.joinedAt} 加入以后参加过「${completedActivity.name}」，目前「${profile.currentActivity.name}」仍为你保留。若你愿意回来，可以从一个最小动作开始；最近不方便也可以直接告诉我。`,
    `${profile.displayName}，想起你之前参加过「${completedActivity.name}」，所以来轻轻问候一下。我们已经有一段时间没有联系，不需要补作业或赶进度；如果你想重新开始，「${profile.currentActivity.name}」可以从最轻松的一步接上。`,
    `${profile.displayName}，很久没听到你的近况了。你在 ${profile.joinedAt} 加入，也曾认真体验过「${completedActivity.name}」。这次只是想告诉你：这里一直欢迎你。等你愿意时，我们可以一起看看「${profile.currentActivity.name}」现在从哪里开始最合适。`,
  ];
  return {
    layer: "sleeping",
    actionLabel: "生成唤醒话术",
    statusLabel: "沉睡会员 · 低压力唤醒",
    message: sleepingMessages[variant],
    basis: sharedBasis,
    variant,
  };
}
