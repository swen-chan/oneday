import { parseWeChatExport } from './chat-parser';

// 微信群聊天记录导出（txt）解析器。
// 输入是"品牌方手动导出上传"的记录文件（MVP 数据接入路线 A）。
// 所有 fixture 均为合成数据——demo-first 决策（2026-07-08）：不入真实聊天。

const SAMPLE = `2026-07-01 08:30:15 王小美
早上好呀，今天开始揉腹打卡！

2026-07-01 08:32:40 李大力
我也来～昨晚睡得特别好

2026-07-01 09:10:02 王小美
[图片]

2026-07-03 21:45:00 陈静
最近总是失眠，有什么建议吗？我电话13812345678
`;

describe('parseWeChatExport', () => {
  it('解析出全部消息与发送者', () => {
    const result = parseWeChatExport(SAMPLE, { groupId: 'g1' });
    expect(result.messages).toHaveLength(4);
    expect(result.members).toHaveLength(3);
  });

  it('多行消息体归属同一条消息', () => {
    const multi = `2026-07-01 10:00:00 王小美\n第一行\n第二行还是这条\n\n2026-07-01 10:05:00 李大力\n新消息`;
    const result = parseWeChatExport(multi, { groupId: 'g1' });
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].content).toBe('第一行\n第二行还是这条');
  });

  it('解析时间戳为 Date', () => {
    const result = parseWeChatExport(SAMPLE, { groupId: 'g1' });
    expect(result.messages[0].sentAt.toISOString()).toBe(
      new Date('2026-07-01T08:30:15+08:00').toISOString(),
    );
  });

  it('识别媒体占位消息类型', () => {
    const result = parseWeChatExport(SAMPLE, { groupId: 'g1' });
    expect(result.messages[2].contentType).toBe('media');
    expect(result.messages[0].contentType).toBe('text');
  });

  it('默认脱敏：成员名转代号、正文手机号打码', () => {
    const result = parseWeChatExport(SAMPLE, { groupId: 'g1' });
    const senders = result.messages.map((m) => m.senderAlias);
    expect(senders.every((s) => /^成员[A-Z0-9]{4}$/.test(s))).toBe(true);
    const last = result.messages[3];
    expect(last.content).not.toContain('13812345678');
    expect(last.content).toContain('138****5678');
  });

  it('同一成员多条消息映射到同一代号', () => {
    const result = parseWeChatExport(SAMPLE, { groupId: 'g1' });
    expect(result.messages[0].senderAlias).toBe(result.messages[2].senderAlias);
  });

  it('汇总每个成员的最后活跃时间', () => {
    const result = parseWeChatExport(SAMPLE, { groupId: 'g1' });
    const wang = result.members.find(
      (m) => m.alias === result.messages[0].senderAlias,
    );
    expect(wang?.lastActiveAt.toISOString()).toBe(
      new Date('2026-07-01T09:10:02+08:00').toISOString(),
    );
    expect(wang?.messageCount).toBe(2);
  });

  it('拒绝无法解析出任何消息的输入', () => {
    expect(() =>
      parseWeChatExport('随便一段不是导出格式的文字', { groupId: 'g1' }),
    ).toThrow(/无法识别/);
  });

  it('报告导出的时间范围', () => {
    const result = parseWeChatExport(SAMPLE, { groupId: 'g1' });
    expect(result.periodStart.toISOString()).toBe(
      new Date('2026-07-01T08:30:15+08:00').toISOString(),
    );
    expect(result.periodEnd.toISOString()).toBe(
      new Date('2026-07-03T21:45:00+08:00').toISOString(),
    );
  });
});
