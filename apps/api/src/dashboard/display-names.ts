// 展示层化名：把「成员A1B2C3D4」映射为「学员·青禾07」这类更像人的称呼。
// 约束（验收红线）：组内与底层代号 1:1——基础化名撞名时用代号前 4 位消歧，
// 消歧只依赖代号本身（与集合顺序无关），因此仍是确定性的。
// 底层代号不变：脱敏与碰撞防护均在数据层保留。

const NATURE_WORDS = [
  '青禾',
  '晚风',
  '山月',
  '溪云',
  '暖阳',
  '细雨',
  '松间',
  '竹影',
  '栖霞',
  '汀兰',
  '芷若',
  '沐晨',
  '拾光',
  '知微',
  '守拙',
  '望舒',
  '静好',
  '安然',
  '疏影',
  '暗香',
  '听泉',
  '观澜',
  '若水',
  '致远',
  '云舒',
  '花信',
  '梧秋',
  '苔青',
  '禾念',
  '津渡',
  '南枝',
  '北辰',
  '初霁',
  '宿雨',
  '停云',
  '归鸿',
  '栖迟',
  '容与',
  '澄怀',
  '素心',
  '闻笛',
  '踏歌',
  '临溪',
  '倚竹',
  '扶摇',
  '曳尾',
  '灼灼',
  '呦呦',
  '采薇',
  '流萤',
  '皎皎',
  '迢迢',
  '盈盈',
  '脉脉',
  '悠悠',
  '田田',
  '漠漠',
  '依依',
  '湛湛',
  '苍苍',
  '泠泠',
  '涓涓',
  '皑皑',
  '莹莹',
] as const;

const ALIAS_RE = /^成员([0-9A-F]{8})$/;

/**
 * 为一组底层代号生成展示化名。返回 alias → displayName 的 Map。
 * 保证：确定性、组内唯一（1:1）、不含原代号信息以外的任何真实信息。
 */
export function buildDisplayNames(aliases: string[]): Map<string, string> {
  const result = new Map<string, string>();
  const baseNames = new Map<string, string>();
  const baseCounts = new Map<string, number>();

  for (const alias of aliases) {
    const match = alias.match(ALIAS_RE);
    if (!match) {
      baseNames.set(alias, alias);
      continue;
    }
    const hex = match[1];
    const word =
      NATURE_WORDS[parseInt(hex.slice(0, 4), 16) % NATURE_WORDS.length];
    const num = (parseInt(hex.slice(4, 8), 16) % 100)
      .toString()
      .padStart(2, '0');
    const base = `学员·${word}${num}`;
    baseNames.set(alias, base);
    baseCounts.set(base, (baseCounts.get(base) ?? 0) + 1);
  }

  for (const alias of aliases) {
    const base = baseNames.get(alias)!;
    const match = alias.match(ALIAS_RE);
    if (match && (baseCounts.get(base) ?? 0) > 1) {
      // 撞名：附完整 8 位代号消歧——代号本身唯一 ⇒ 化名绝对唯一（1:1 红线），
      // 且只依赖代号本身 → 与集合顺序无关、确定性
      result.set(alias, `${base}·${match[1]}`);
    } else {
      result.set(alias, base);
    }
  }

  return result;
}
