// demo 模式的合成群聊数据生成器。
// 确定性：LCG 伪随机 + 调用方传入 endDate，不读系统时钟、不用 Math.random，
// 同参数永远生成同一份数据（演示可复现，也符合数据严谨性口径）。

export interface SyntheticExportOptions {
  memberCount: number;
  days: number;
  endDate: Date;
  seed: number;
  /** 画像配比（各 0-1，其余为沉睡）。缺省 active 0.5 / cooling 0.25。 */
  profileMix?: { active: number; cooling: number };
}

const FIRST = [
  '小雨',
  '安然',
  '沐子',
  '青禾',
  '知夏',
  '若云',
  '静好',
  '暖暖',
  '一禾',
  '苏苏',
];
const LAST = ['林', '沈', '顾', '温', '许', '陆', '宋', '叶'];

const LINES = [
  '今天的练习完成啦，感觉整个人松下来了',
  '早上留了十分钟给自己，很值得',
  '打卡～今天状态不错',
  '昨晚睡得比之前踏实一些了',
  '这周的主题对我太有用了',
  '今天有点忙，晚上补上练习',
  '看到大家都在坚持，我也来啦',
  '揉腹之后胃口好像好一点了',
  '[图片]',
  '感恩日记写到第十天了，回头看很触动',
  '今天走了很久的路，心里安静了不少',
  '这个引导音频很舒服，循环了两遍',
];

function lcg(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatTimestamp(date: Date): string {
  // 输出按中国时区（与真实导出格式一致）
  const utc8 = new Date(date.getTime() + 8 * 3600 * 1000);
  return (
    `${utc8.getUTCFullYear()}-${pad(utc8.getUTCMonth() + 1)}-${pad(utc8.getUTCDate())} ` +
    `${pad(utc8.getUTCHours())}:${pad(utc8.getUTCMinutes())}:${pad(utc8.getUTCSeconds())}`
  );
}

export function generateSyntheticExport(
  options: SyntheticExportOptions,
): string {
  const rand = lcg(options.seed);
  const dayMs = 24 * 3600 * 1000;
  const start = options.endDate.getTime() - options.days * dayMs;

  // 成员画像按配比分配（默认 1/2 活跃、1/4 降温、其余沉睡）
  const mix = options.profileMix ?? { active: 0.5, cooling: 0.25 };
  const activeCount = Math.round(options.memberCount * mix.active);
  const coolingCount = Math.round(options.memberCount * mix.cooling);
  const members = Array.from({ length: options.memberCount }, (_, i) => {
    const name = `${LAST[i % LAST.length]}${FIRST[(i * 7) % FIRST.length]}${i}`;
    const profile =
      i < activeCount
        ? 'active'
        : i < activeCount + coolingCount
          ? 'cooling'
          : 'sleeping';
    return { name, profile };
  });

  const events: { at: Date; name: string; line: string }[] = [];
  for (const m of members) {
    // 每个画像的「最后一条消息」直接锚定到对应分层区间的安全位置
    // （阈值 7/30 天，锚点离阈值 ≥2 天，时刻抖动 ±<1 天不会翻层）：
    // active ≤2 天前；cooling 12-22 天前；sleeping 35-55 天前
    const lastMessageDaysAgo =
      m.profile === 'active'
        ? rand() * 2
        : m.profile === 'cooling'
          ? 12 + rand() * 10
          : 35 + rand() * 20;
    const anchor = options.endDate.getTime() - lastMessageDaysAgo * dayMs;
    const messageCount = 2 + Math.floor(rand() * 6);
    for (let k = 0; k < messageCount; k++) {
      // 第一条 = 锚点；其余分布在锚点之前
      const t =
        k === 0 ? anchor : Math.max(start, anchor - rand() * 25 * dayMs);
      const at = new Date(t);
      // 时刻落在白天 7:00-22:59（对锚点最多前移，不会后移出层）
      at.setUTCHours(
        7 + Math.floor(rand() * 15),
        Math.floor(rand() * 60),
        Math.floor(rand() * 60),
        0,
      );
      if (at.getTime() > options.endDate.getTime()) {
        at.setTime(
          options.endDate.getTime() - Math.floor(rand() * 3600 * 1000),
        );
      }
      events.push({
        at,
        name: m.name,
        line: LINES[Math.floor(rand() * LINES.length)],
      });
    }
  }

  events.sort((a, b) => a.at.getTime() - b.at.getTime());

  return events
    .map((e) => `${formatTimestamp(e.at)} ${e.name}\n${e.line}\n`)
    .join('\n');
}
