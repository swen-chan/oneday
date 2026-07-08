import { layerMembers, DEFAULT_LAYERING_RULES } from './member-layering';

// 私域健康看板的分层规则核心。纯函数、TDD 全覆盖（验收契约）。
// 分层口径 v0（referenceDate 通常 = 导入数据的 periodEnd，不用系统时钟，
// 保证同一份数据任何时候分析结果一致——数据严谨性内建）。

const ref = new Date('2026-07-08T00:00:00+08:00');

const member = (
  alias: string,
  lastActiveDaysAgo: number,
  messageCount = 5,
) => ({
  alias,
  lastActiveAt: new Date(ref.getTime() - lastActiveDaysAgo * 24 * 3600 * 1000),
  messageCount,
});

describe('layerMembers 分层规则', () => {
  it('7 天内活跃 → active', () => {
    const result = layerMembers([member('成员A001', 3)], ref);
    expect(result.layers.active.map((m) => m.alias)).toEqual(['成员A001']);
  });

  it('8-30 天 → cooling（降温）', () => {
    const result = layerMembers([member('成员B002', 15)], ref);
    expect(result.layers.cooling).toHaveLength(1);
  });

  it('超过 30 天 → sleeping（沉睡）', () => {
    const result = layerMembers([member('成员C003', 45)], ref);
    expect(result.layers.sleeping).toHaveLength(1);
  });

  it('边界值：恰好 7 天算 active，恰好 30 天算 cooling', () => {
    const result = layerMembers(
      [member('成员D004', 7), member('成员E005', 30)],
      ref,
    );
    expect(result.layers.active).toHaveLength(1);
    expect(result.layers.cooling).toHaveLength(1);
    expect(result.layers.sleeping).toHaveLength(0);
  });

  it('汇总健康指标：各层计数与占比', () => {
    const result = layerMembers(
      [member('a', 1), member('b', 2), member('c', 20), member('d', 60)],
      ref,
    );
    expect(result.summary).toMatchObject({
      total: 4,
      activeCount: 2,
      coolingCount: 1,
      sleepingCount: 1,
    });
    expect(result.summary.activeRatio).toBeCloseTo(0.5);
  });

  it('健康分：全员活跃=100，全员沉睡=0', () => {
    const allActive = layerMembers([member('a', 1), member('b', 2)], ref);
    expect(allActive.summary.healthScore).toBe(100);
    const allSleeping = layerMembers([member('a', 90), member('b', 60)], ref);
    expect(allSleeping.summary.healthScore).toBe(0);
  });

  it('健康分：混合分层按权重折算（cooling 计半）', () => {
    // 2 active + 2 cooling + 0 sleeping → (2*1 + 2*0.5) / 4 = 75
    const result = layerMembers(
      [member('a', 1), member('b', 2), member('c', 10), member('d', 20)],
      ref,
    );
    expect(result.summary.healthScore).toBe(75);
  });

  it('空成员列表返回零值而非 NaN', () => {
    const result = layerMembers([], ref);
    expect(result.summary.total).toBe(0);
    expect(result.summary.healthScore).toBe(0);
    expect(result.summary.activeRatio).toBe(0);
  });

  it('分层结果内按最后活跃时间降序（最需要跟进的排前面用 asc？——沉睡层按沉睡最久优先）', () => {
    const result = layerMembers(
      [member('新沉睡', 31), member('久沉睡', 90)],
      ref,
    );
    expect(result.layers.sleeping[0].alias).toBe('久沉睡');
  });

  it('规则阈值可配置', () => {
    const strict = { ...DEFAULT_LAYERING_RULES, activeWithinDays: 3 };
    const result = layerMembers([member('a', 5)], ref, strict);
    expect(result.layers.active).toHaveLength(0);
    expect(result.layers.cooling).toHaveLength(1);
  });
});
