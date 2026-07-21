export const memberProgramVersion = 2 as const;
export const memberJourneyLength = 7 as const;
export const memberProgramStoragePrefix = "oneday-member-program-v2";
export const legacyMemberProgramStoragePrefix = "oneday-member-program-v1";
export const demoSessionStorageKey = "oneday-demo-role-session";

export const concernOptions = [
  { id: "rhythm", label: "日常节律容易被打乱" },
  { id: "focus", label: "注意力常被许多事情拉走" },
  { id: "connection", label: "想连接他人，但不容易迈出第一步" },
  { id: "expression", label: "有想法，却迟迟没有开始表达" },
] as const;

export const stateOptions = [
  { id: "low-energy", label: "今天精力偏低，适合从小动作开始" },
  { id: "scattered", label: "思绪比较分散，需要先收拢重点" },
  { id: "hesitant", label: "心里有方向，但行动时容易犹豫" },
  { id: "overloaded", label: "手上的事情偏多，需要主动减量" },
] as const;

export const goalOptions = [
  { id: "steady-rhythm", label: "建立更稳定的日常节奏" },
  { id: "clear-action", label: "每天都知道下一步做什么" },
  { id: "open-expression", label: "更自然地表达和连接" },
  { id: "visible-progress", label: "留下可以看见的小成果" },
] as const;

export const memberReflectionOptions = [
  { id: "flowing", label: "比想象中顺" },
  { id: "steady", label: "刚刚好" },
  { id: "challenging", label: "有点挑战" },
  { id: "enough", label: "今天先做到这里" },
] as const;

export type ConcernId = (typeof concernOptions)[number]["id"];
export type MemberStateId = (typeof stateOptions)[number]["id"];
export type GoalId = (typeof goalOptions)[number]["id"];
export type MemberReflectionChoice = (typeof memberReflectionOptions)[number]["id"];

export interface MemberAssessment {
  concern: ConcernId;
  state: MemberStateId;
  goal: GoalId;
}

export interface MemberTask {
  id: string;
  title: string;
  description: string;
  basedOn: string;
}

export interface MemberPlan {
  internal: MemberTask[];
  external: MemberTask[];
  rationale: string[];
}

export interface MemberCheckinSummary {
  day: number;
  dateKey: string;
  completedTaskIds: string[];
  blockerProvided: boolean;
  feedbackFocusProvided: boolean;
  reflectionChoice?: MemberReflectionChoice;
}

export interface MemberProgramState {
  version: typeof memberProgramVersion;
  assessment: MemberAssessment;
  plan: MemberPlan;
  startedOn: string;
  demoDayOffset: number;
  draftDateKey?: string;
  draftCompletedTaskIds: string[];
  checkins: MemberCheckinSummary[];
}

export type MemberJourneyDayStatus = "recorded" | "missed" | "today" | "locked";

export interface MemberJourneyDay {
  day: number;
  dateKey: string;
  status: MemberJourneyDayStatus;
  isToday: boolean;
  checkin?: MemberCheckinSummary;
}

export interface DemoSessionLike {
  email: string;
  label: string;
  roles: string[];
}

type TaskPair = {
  internal: Omit<MemberTask, "id" | "basedOn">;
  external: Omit<MemberTask, "id" | "basedOn">;
};

const concernTasks: Record<ConcernId, TaskPair> = {
  rhythm: {
    internal: {
      title: "留出 10 分钟收尾时间",
      description: "在今天结束前整理桌面和明日第一件小事。",
    },
    external: {
      title: "说明一次今天的时间边界",
      description: "对一个相关的人说清今天能完成什么、何时回复。",
    },
  },
  focus: {
    internal: {
      title: "做一张三项清空清单",
      description: "把脑中的事情写下，只圈出今天最重要的一项。",
    },
    external: {
      title: "确认一个首要事项",
      description: "向协作对象确认今天最值得推进的一个结果。",
    },
  },
  connection: {
    internal: {
      title: "写下一句想被理解的话",
      description: "先写给自己看，不急着解释或评价。",
    },
    external: {
      title: "向一位信任的人发出问候",
      description: "一句近况或感谢就够了，不要求展开长聊。",
    },
  },
  expression: {
    internal: {
      title: "用三句话记下一个想法",
      description: "写清它为什么重要、现在想到什么、下一步是什么。",
    },
    external: {
      title: "发出一条 50 字以内的表达",
      description: "可以发在朋友圈、社群，或只发给一位朋友。",
    },
  },
};

const stateTasks: Record<MemberStateId, TaskPair> = {
  "low-energy": {
    internal: {
      title: "慢走或舒展 10 分钟",
      description: "按今天舒服的强度活动，不追求速度和数量。",
    },
    external: {
      title: "主动减掉一个非必要回应",
      description: "礼貌延后或取消一件今天不必完成的沟通。",
    },
  },
  scattered: {
    internal: {
      title: "完成一轮 15 分钟单任务",
      description: "关掉额外提醒，只处理刚刚圈出的那一件事。",
    },
    external: {
      title: "收口一条未完成消息",
      description: "回复、确认或明确下一次跟进时间，三选一即可。",
    },
  },
  hesitant: {
    internal: {
      title: "给下一步设一个低门槛版本",
      description: "把动作缩小到 15 分钟内可以开始。",
    },
    external: {
      title: "向一个人问清一个具体问题",
      description: "用问题换取信息，不要求自己一次做出完美决定。",
    },
  },
  overloaded: {
    internal: {
      title: "做 3 分钟停顿并删去一项",
      description: "先停下来，再从今日清单中移除一件低优先事项。",
    },
    external: {
      title: "协商一个更现实的时间点",
      description: "为一项任务重新确认范围或完成时间。",
    },
  },
};

const goalTasks: Record<GoalId, TaskPair> = {
  "steady-rhythm": {
    internal: {
      title: "设定明天的固定起步动作",
      description: "选一个起床后能重复的小动作，并写下开始时间。",
    },
    external: {
      title: "把一个可用时间告诉伙伴",
      description: "用明确时间减少来回确认，让节奏更稳定。",
    },
  },
  "clear-action": {
    internal: {
      title: "写下明天最小的第一步",
      description: "只写一个动词开头、可以立即执行的动作。",
    },
    external: {
      title: "承诺一个可交付的下一步",
      description: "向相关的人说明你接下来会完成的最小结果。",
    },
  },
  "open-expression": {
    internal: {
      title: "完成一份不公开的表达草稿",
      description: "允许它不完整，先保留今天真实的想法。",
    },
    external: {
      title: "把一段草稿分享给一个人",
      description: "选择安全的对象，只邀请对方听见，不要求评价。",
    },
  },
  "visible-progress": {
    internal: {
      title: "保存一份今日完成证据",
      description: "用一张截图、一行记录或一个勾选留下痕迹。",
    },
    external: {
      title: "交付一个最小可见结果",
      description: "提交、发布或分享今天已经完成的最小版本。",
    },
  },
};

function optionLabel<T extends readonly { id: string; label: string }[]>(
  options: T,
  id: T[number]["id"],
) {
  return options.find((option) => option.id === id)?.label ?? "当前选择";
}

function taskWithContext(
  prefix: string,
  dimensionLabel: string,
  task: Omit<MemberTask, "id" | "basedOn">,
): MemberTask {
  return {
    id: prefix,
    ...task,
    basedOn: dimensionLabel,
  };
}

export function createMemberPlan(assessment: MemberAssessment): MemberPlan {
  const concernLabel = optionLabel(concernOptions, assessment.concern);
  const stateLabel = optionLabel(stateOptions, assessment.state);
  const goalLabel = optionLabel(goalOptions, assessment.goal);
  const concernPair = concernTasks[assessment.concern];
  const statePair = stateTasks[assessment.state];
  const goalPair = goalTasks[assessment.goal];

  return {
    internal: [
      taskWithContext(`concern-${assessment.concern}-internal`, `当前困扰：${concernLabel}`, concernPair.internal),
      taskWithContext(`state-${assessment.state}-internal`, `当前状态：${stateLabel}`, statePair.internal),
      taskWithContext(`goal-${assessment.goal}-internal`, `7 天目标：${goalLabel}`, goalPair.internal),
    ],
    external: [
      taskWithContext(`concern-${assessment.concern}-external`, `当前困扰：${concernLabel}`, concernPair.external),
      taskWithContext(`state-${assessment.state}-external`, `当前状态：${stateLabel}`, statePair.external),
      taskWithContext(`goal-${assessment.goal}-external`, `7 天目标：${goalLabel}`, goalPair.external),
    ],
    rationale: [
      `从“${concernLabel}”出发，先安排一个可以收口当前困扰的动作。`,
      `考虑到“${stateLabel}”，今天的动作被控制在低门槛、可完成的范围。`,
      `围绕“${goalLabel}”，对内与对外任务各保留一个可持续方向。`,
    ],
  };
}

export function memberDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isMemberDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return memberDateKey(date) === value;
}

export function addMemberDays(dateKey: string, days: number) {
  if (!isMemberDateKey(dateKey)) return dateKey;
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return memberDateKey(date);
}

export function memberDayDistance(fromDateKey: string, toDateKey: string) {
  if (!isMemberDateKey(fromDateKey) || !isMemberDateKey(toDateKey)) return 0;
  const [fromYear, fromMonth, fromDay] = fromDateKey.split("-").map(Number);
  const [toYear, toMonth, toDay] = toDateKey.split("-").map(Number);
  return Math.round(
    (Date.UTC(toYear, toMonth - 1, toDay) - Date.UTC(fromYear, fromMonth - 1, fromDay)) /
      86_400_000,
  );
}

export function memberJourneyDayNumber(startedOn: string, dateKey: string) {
  return memberDayDistance(startedOn, dateKey) + 1;
}

export function formatMemberDate(dateKey: string) {
  if (!isMemberDateKey(dateKey)) return dateKey;
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function createMemberProgramState(
  assessment: MemberAssessment,
  startedOn = memberDateKey(),
): MemberProgramState {
  const safeStartedOn = isMemberDateKey(startedOn) ? startedOn : memberDateKey();
  return {
    version: memberProgramVersion,
    assessment,
    plan: createMemberPlan(assessment),
    startedOn: safeStartedOn,
    demoDayOffset: 0,
    draftCompletedTaskIds: [],
    checkins: [],
  };
}

export function allMemberTasks(program: MemberProgramState) {
  return [...program.plan.internal, ...program.plan.external];
}

function knownTaskIds(program: MemberProgramState) {
  return new Set(allMemberTasks(program).map((task) => task.id));
}

export function memberEffectiveTodayDateKey(program: MemberProgramState, today = memberDateKey()) {
  return addMemberDays(today, program.demoDayOffset);
}

export function memberCheckinForDate(program: MemberProgramState, dateKey: string) {
  return program.checkins.find((checkin) => checkin.dateKey === dateKey);
}

export function latestMemberCheckin(program: MemberProgramState) {
  return [...program.checkins].sort((left, right) => right.day - left.day)[0];
}

export function memberCompletedDays(program: MemberProgramState) {
  return program.checkins.length;
}

export function memberTaskCompletedDays(program: MemberProgramState, taskId: string) {
  if (!knownTaskIds(program).has(taskId)) return 0;
  return program.checkins.filter((checkin) => checkin.completedTaskIds.includes(taskId)).length;
}

export function memberJourneyDays(
  program: MemberProgramState,
  todayDateKey = memberEffectiveTodayDateKey(program),
): MemberJourneyDay[] {
  return Array.from({ length: memberJourneyLength }, (_, index) => {
    const day = index + 1;
    const dateKey = addMemberDays(program.startedOn, index);
    const checkin = memberCheckinForDate(program, dateKey);
    const isToday = dateKey === todayDateKey;
    const status: MemberJourneyDayStatus = checkin
      ? "recorded"
      : isToday
        ? "today"
        : dateKey < todayDateKey
          ? "missed"
          : "locked";
    return { day, dateKey, status, isToday, checkin };
  });
}

export function canSubmitMemberCheckin(
  program: MemberProgramState,
  todayDateKey = memberEffectiveTodayDateKey(program),
) {
  const day = memberJourneyDayNumber(program.startedOn, todayDateKey);
  return (
    day >= 1 &&
    day <= memberJourneyLength &&
    !memberCheckinForDate(program, todayDateKey)
  );
}

export function memberCheckinDraftForDate(program: MemberProgramState, dateKey: string) {
  return program.draftDateKey === dateKey ? program.draftCompletedTaskIds : [];
}

export function updateMemberCheckinDraft(
  program: MemberProgramState,
  completedTaskIds: string[],
  dateKey = memberEffectiveTodayDateKey(program),
): MemberProgramState {
  if (!canSubmitMemberCheckin(program, dateKey)) return program;
  const knownIds = knownTaskIds(program);
  return {
    ...program,
    draftDateKey: dateKey,
    draftCompletedTaskIds: [...new Set(completedTaskIds)].filter((id) => knownIds.has(id)),
  };
}

export function completeMemberCheckin(
  program: MemberProgramState,
  completedTaskIds: string[],
  blockerProvided: boolean,
  feedbackFocusProvided: boolean,
  dateKey = memberEffectiveTodayDateKey(program),
  reflectionChoice?: MemberReflectionChoice,
): MemberProgramState {
  if (!canSubmitMemberCheckin(program, dateKey)) return program;
  const knownIds = knownTaskIds(program);
  const safeTaskIds = [...new Set(completedTaskIds)].filter((id) => knownIds.has(id));
  const day = memberJourneyDayNumber(program.startedOn, dateKey);
  const checkin: MemberCheckinSummary = {
    day,
    dateKey,
    completedTaskIds: safeTaskIds,
    blockerProvided,
    feedbackFocusProvided,
    reflectionChoice: memberReflectionOptions.some((option) => option.id === reflectionChoice)
      ? reflectionChoice
      : undefined,
  };
  return {
    ...program,
    draftDateKey: undefined,
    draftCompletedTaskIds: [],
    checkins: [...program.checkins, checkin].sort((left, right) => left.day - right.day),
  };
}

export function advanceMemberDemoDay(
  program: MemberProgramState,
  todayDateKey = memberDateKey(),
): MemberProgramState {
  const currentDay = memberJourneyDayNumber(
    program.startedOn,
    memberEffectiveTodayDateKey(program, todayDateKey),
  );
  if (currentDay >= memberJourneyLength) return program;
  return {
    ...program,
    demoDayOffset: Math.min(memberJourneyLength - 1, program.demoDayOffset + 1),
    draftDateKey: undefined,
    draftCompletedTaskIds: [],
  };
}

export function resetMemberDemoDay(program: MemberProgramState): MemberProgramState {
  if (program.demoDayOffset === 0) return program;
  return {
    ...program,
    demoDayOffset: 0,
    draftDateKey: undefined,
    draftCompletedTaskIds: [],
  };
}

export function buildMemberFeedback(
  program: MemberProgramState,
  checkin = latestMemberCheckin(program),
) {
  if (!checkin) return null;
  const completedCount = checkin.completedTaskIds.length;
  const taskMessage =
    completedCount === 6
      ? "六个泡泡都被你点亮了。不是因为今天必须完美，而是你让六个小动作都真实发生了。"
      : completedCount >= 4
        ? `你今天点亮了 ${completedCount} 个泡泡，已经把想法变成了一组看得见的小行动。`
      : completedCount >= 3
        ? `你今天点亮了 ${completedCount} 个泡泡，节奏正在从“想做”走向“做得到”。`
        : `你今天点亮了 ${completedCount} 个泡泡。数量不必多，愿意开始本身就是今天的进展。`;
  const reflectionMessages: Record<MemberReflectionChoice, string> = {
    flowing: "今天比想象中更顺，记住这种低阻力的开始方式。",
    steady: "今天的分量刚刚好，可重复比一次做满更重要。",
    challenging: "今天有点挑战，但你仍留下了真实的完成痕迹。",
    enough: "今天先做到这里也很好，给节奏留一点呼吸空间。",
  };
  const reflectionMessage = checkin.reflectionChoice
    ? reflectionMessages[checkin.reflectionChoice]
    : checkin.blockerProvided
      ? "你也为今天选了一句感受，让这次记录更完整。"
      : "今天没有额外复盘也没关系，行动本身已经被记录。";
  const noteMessage = checkin.feedbackFocusProvided
    ? "你还给今天留了一句补充；系统只记录“已补充”，不会保存原文。"
    : "你跳过了补充文字，保持轻量也很好。";
  const completedIds = new Set(checkin.completedTaskIds);
  const nextTask = allMemberTasks(program).find((task) => !completedIds.has(task.id));
  const nextStep = nextTask
    ? `明天可以先从“${nextTask.title}”里挑一个最小动作继续。`
    : "明天不用加码，只要用同样的方式再开始一次。";

  return {
    title: completedCount === 6 ? "今天的六个泡泡都亮了" : "今天，已经向前一步",
    encouragement: taskMessage,
    nextStep,
    paragraphs: [
      taskMessage,
      reflectionMessage,
      noteMessage,
      nextStep,
    ],
    tags: ["已记录今日行动", "保持低门槛", completedCount === 6 ? "六项完成" : "允许部分完成"],
  };
}

function isAssessment(value: unknown): value is MemberAssessment {
  if (!value || typeof value !== "object") return false;
  const assessment = value as Partial<MemberAssessment>;
  return (
    concernOptions.some((option) => option.id === assessment.concern) &&
    stateOptions.some((option) => option.id === assessment.state) &&
    goalOptions.some((option) => option.id === assessment.goal)
  );
}

function safeTaskIdsFromUnknown(value: unknown, program: MemberProgramState) {
  if (!Array.isArray(value)) return [];
  const knownIds = knownTaskIds(program);
  return [...new Set(value)].filter(
    (id): id is string => typeof id === "string" && knownIds.has(id),
  );
}

function parseStoredCheckin(
  value: unknown,
  program: MemberProgramState,
): MemberCheckinSummary | null {
  if (!value || typeof value !== "object") return null;
  const checkin = value as Partial<MemberCheckinSummary>;
  if (
    typeof checkin.day !== "number" ||
    !Number.isFinite(checkin.day) ||
    typeof checkin.blockerProvided !== "boolean" ||
    typeof checkin.feedbackFocusProvided !== "boolean"
  ) {
    return null;
  }
  const day = Math.floor(checkin.day);
  if (day < 1 || day > memberJourneyLength) return null;
  const expectedDateKey = addMemberDays(program.startedOn, day - 1);
  if (checkin.dateKey !== expectedDateKey) return null;
  const reflectionChoice = memberReflectionOptions.find(
    (option) => option.id === checkin.reflectionChoice,
  )?.id;
  return {
    day,
    dateKey: expectedDateKey,
    completedTaskIds: safeTaskIdsFromUnknown(checkin.completedTaskIds, program),
    blockerProvided: checkin.blockerProvided,
    feedbackFocusProvided: checkin.feedbackFocusProvided,
    reflectionChoice,
  };
}

export function parseMemberProgramState(
  raw: string | null,
  todayDateKey = memberDateKey(),
): MemberProgramState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!isAssessment(parsed.assessment)) return null;

    if (parsed.version === 1) {
      const legacyCheckin =
        parsed.lastCheckin && typeof parsed.lastCheckin === "object"
          ? (parsed.lastCheckin as Record<string, unknown>)
          : null;
      const legacyDay =
        typeof legacyCheckin?.day === "number" && Number.isFinite(legacyCheckin.day)
          ? Math.max(1, Math.min(memberJourneyLength, Math.floor(legacyCheckin.day)))
          : 1;
      const startedOn = legacyCheckin ? addMemberDays(todayDateKey, -(legacyDay - 1)) : todayDateKey;
      let migrated = createMemberProgramState(parsed.assessment, startedOn);

      if (
        legacyCheckin &&
        typeof legacyCheckin.blockerProvided === "boolean" &&
        typeof legacyCheckin.feedbackFocusProvided === "boolean"
      ) {
        migrated = {
          ...migrated,
          checkins: [
            {
              day: legacyDay,
              dateKey: addMemberDays(startedOn, legacyDay - 1),
              completedTaskIds: safeTaskIdsFromUnknown(
                legacyCheckin.completedTaskIds,
                migrated,
              ),
              blockerProvided: legacyCheckin.blockerProvided,
              feedbackFocusProvided: legacyCheckin.feedbackFocusProvided,
            },
          ],
        };
      }

      const legacyDraft = safeTaskIdsFromUnknown(parsed.draftCompletedTaskIds, migrated);
      if (legacyDraft.length && canSubmitMemberCheckin(migrated, todayDateKey)) {
        migrated = updateMemberCheckinDraft(migrated, legacyDraft, todayDateKey);
      }
      return migrated;
    }

    if (parsed.version !== memberProgramVersion) return null;
    const startedOn = isMemberDateKey(parsed.startedOn) ? parsed.startedOn : todayDateKey;
    const demoDayOffset =
      typeof parsed.demoDayOffset === "number" && Number.isFinite(parsed.demoDayOffset)
        ? Math.max(0, Math.min(memberJourneyLength - 1, Math.floor(parsed.demoDayOffset)))
        : 0;
    let next: MemberProgramState = {
      ...createMemberProgramState(parsed.assessment, startedOn),
      demoDayOffset,
    };
    const seenDates = new Set<string>();
    const checkins = Array.isArray(parsed.checkins)
      ? parsed.checkins
          .map((checkin) => parseStoredCheckin(checkin, next))
          .filter((checkin): checkin is MemberCheckinSummary => {
            if (!checkin || seenDates.has(checkin.dateKey)) return false;
            seenDates.add(checkin.dateKey);
            return true;
          })
          .sort((left, right) => left.day - right.day)
      : [];
    next = { ...next, checkins };

    const draftDateKey = isMemberDateKey(parsed.draftDateKey) ? parsed.draftDateKey : null;
    if (
      draftDateKey &&
      draftDateKey === memberEffectiveTodayDateKey(next, todayDateKey) &&
      canSubmitMemberCheckin(next, draftDateKey)
    ) {
      next = updateMemberCheckinDraft(
        next,
        safeTaskIdsFromUnknown(parsed.draftCompletedTaskIds, next),
        draftDateKey,
      );
    }
    return next;
  } catch {
    return null;
  }
}

export function serializeMemberProgramState(program: MemberProgramState) {
  return JSON.stringify(program);
}

function memberProgramStorageKeyForPrefix(identity: string, prefix: string) {
  let hash = 2166136261;
  for (const char of identity.trim().toLowerCase()) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function memberProgramStorageKey(identity: string) {
  return memberProgramStorageKeyForPrefix(identity, memberProgramStoragePrefix);
}

export function legacyMemberProgramStorageKey(identity: string) {
  return memberProgramStorageKeyForPrefix(identity, legacyMemberProgramStoragePrefix);
}

export function canAccessMemberWorkspace(session: DemoSessionLike | null) {
  return session?.roles.includes("member") ?? false;
}

export function memberHomeRoute(program: MemberProgramState | null) {
  return program ? "/member/today" : "/member/onboarding";
}
