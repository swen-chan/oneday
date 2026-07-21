export interface HealthMemberInput {
  alias: string;
  displayName?: string;
  lastActiveAt: string;
  messageCount: number;
}

export interface MemberActivityRecord {
  name: string;
  times: number;
}

export interface SyntheticMemberProfile {
  displayName: string;
  memberStage: string;
  joinedAt: string;
  currentFocus: string;
  completedActivities: MemberActivityRecord[];
  currentActivity: {
    name: string;
    day: number;
    totalDays: number;
  };
  todayCheckin: {
    status: "checked" | "pending";
    completedCount: number;
    feedback?: string;
  };
}

const activityNames = [
  "睡眠线下营",
  "脾胃线上营",
  "7 天线上营",
  "精油体验营",
  "21 天节律营",
  "身心舒展工作坊",
] as const;

const currentActivities = ["睡眠节律 7 天营", "轻盈脾胃 14 天营", "日常表达 21 天营"] as const;
const memberStages = ["持续行动会员", "新加入会员", "稳定复训会员"] as const;
const currentFocuses = ["睡眠与日常节律", "轻盈饮食与能量", "表达与外部连接"] as const;
const feedbackOptions = [
  "今天有点挑战，但做完以后比想象中轻松。",
  "今天的分量刚刚好，想把这个节奏保持下去。",
  "先完成了最小版本，已经比一直犹豫更进一步。",
  "六件小事都完成了，明天不加码，只想继续一次。",
] as const;

const dayMilliseconds = 24 * 60 * 60 * 1000;

function stableHash(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function dateKeyDaysBefore(referenceDate: string, days: number) {
  const date = new Date(referenceDate);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function memberActivityLayer(member: HealthMemberInput, referenceDate: string) {
  const idleDays =
    (new Date(referenceDate).getTime() - new Date(member.lastActiveAt).getTime()) /
    dayMilliseconds;
  if (idleDays <= 7) return "active";
  if (idleDays <= 30) return "cooling";
  return "sleeping";
}

export function buildSyntheticMemberProfile(
  member: HealthMemberInput,
  referenceDate: string,
): SyntheticMemberProfile {
  const seed = stableHash(`${member.alias}:${member.lastActiveAt}`);
  const completedActivities = Array.from({ length: 3 }, (_, index) => {
    const name = activityNames[(seed + index * 2) % activityNames.length];
    return {
      name,
      times: name === "7 天线上营" ? 2 + (seed % 3) : 1,
    };
  });
  const totalDays = [7, 14, 21][seed % 3];
  const checked = memberActivityLayer(member, referenceDate) === "active" && seed % 3 !== 0;

  return {
    displayName: member.displayName ?? member.alias,
    memberStage: memberStages[seed % memberStages.length],
    joinedAt: dateKeyDaysBefore(referenceDate, 90 + (seed % 280)),
    currentFocus: currentFocuses[seed % currentFocuses.length],
    completedActivities,
    currentActivity: {
      name: currentActivities[seed % currentActivities.length],
      day: 1 + (seed % totalDays),
      totalDays,
    },
    todayCheckin: checked
      ? {
          status: "checked",
          completedCount: 3 + (seed % 4),
          feedback: feedbackOptions[seed % feedbackOptions.length],
        }
      : {
          status: "pending",
          completedCount: 0,
        },
  };
}
