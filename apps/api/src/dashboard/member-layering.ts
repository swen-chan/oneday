// 私域健康看板 · 成员分层规则 v0。
// 纯函数：同样的输入永远给同样的结果。referenceDate 由调用方传入
// （通常 = 数据的 periodEnd），不读系统时钟——分析结果可复现（数据严谨性内建）。

export interface LayeringInput {
  alias: string;
  lastActiveAt: Date;
  messageCount: number;
}

export interface LayeringRules {
  activeWithinDays: number; // ≤ 此天数 = 活跃
  coolingWithinDays: number; // ≤ 此天数（且 > active）= 降温
}

export const DEFAULT_LAYERING_RULES: LayeringRules = {
  activeWithinDays: 7,
  coolingWithinDays: 30,
};

export interface LayeringResult {
  layers: {
    active: LayeringInput[];
    cooling: LayeringInput[];
    sleeping: LayeringInput[]; // 按沉睡最久优先排序（最需要唤醒动作）
  };
  summary: {
    total: number;
    activeCount: number;
    coolingCount: number;
    sleepingCount: number;
    activeRatio: number;
    healthScore: number; // 0-100：active 计 1、cooling 计 0.5、sleeping 计 0
  };
}

const DAY_MS = 24 * 3600 * 1000;

export function layerMembers(
  members: LayeringInput[],
  referenceDate: Date,
  rules: LayeringRules = DEFAULT_LAYERING_RULES,
): LayeringResult {
  const active: LayeringInput[] = [];
  const cooling: LayeringInput[] = [];
  const sleeping: LayeringInput[] = [];

  for (const m of members) {
    const idleDays =
      (referenceDate.getTime() - m.lastActiveAt.getTime()) / DAY_MS;
    if (idleDays <= rules.activeWithinDays) active.push(m);
    else if (idleDays <= rules.coolingWithinDays) cooling.push(m);
    else sleeping.push(m);
  }

  const byRecent = (a: LayeringInput, b: LayeringInput) =>
    b.lastActiveAt.getTime() - a.lastActiveAt.getTime();
  active.sort(byRecent);
  cooling.sort(byRecent);
  // 沉睡层反向：睡得最久的排最前
  sleeping.sort((a, b) => a.lastActiveAt.getTime() - b.lastActiveAt.getTime());

  const total = members.length;
  const weighted = active.length * 1 + cooling.length * 0.5;

  return {
    layers: { active, cooling, sleeping },
    summary: {
      total,
      activeCount: active.length,
      coolingCount: cooling.length,
      sleepingCount: sleeping.length,
      activeRatio: total === 0 ? 0 : active.length / total,
      healthScore: total === 0 ? 0 : Math.round((weighted / total) * 100),
    },
  };
}
