import { generateSyntheticExport } from './synthetic-data';
import { parseWeChatExport } from '../chat-import/chat-parser';
import { layerMembers } from '../dashboard/member-layering';

// demo 模式的合成数据生成器：确定性（同参数同输出）、
// 走真实解析管线、分层结果覆盖三层（看板一打开就有内容）。

describe('generateSyntheticExport', () => {
  const options = {
    memberCount: 40,
    days: 60,
    endDate: new Date('2026-07-08T00:00:00+08:00'),
    seed: 42,
  };

  it('确定性：同参数生成相同文本', () => {
    expect(generateSyntheticExport(options)).toBe(
      generateSyntheticExport(options),
    );
  });

  it('能被真实解析器解析并产出全部成员', () => {
    const parsed = parseWeChatExport(generateSyntheticExport(options), {
      groupId: 'demo',
    });
    expect(parsed.members.length).toBe(40);
    expect(parsed.messages.length).toBeGreaterThan(100);
  });

  it('分层结果三层皆有成员（演示看板不空）', () => {
    const parsed = parseWeChatExport(generateSyntheticExport(options), {
      groupId: 'demo',
    });
    const result = layerMembers(parsed.members, parsed.periodEnd);
    expect(result.layers.active.length).toBeGreaterThan(0);
    expect(result.layers.cooling.length).toBeGreaterThan(0);
    expect(result.layers.sleeping.length).toBeGreaterThan(0);
  });

  it('合成内容不含禁词（演示数据也过护栏口径）', () => {
    const text = generateSyntheticExport(options);
    expect(text).not.toContain('根治');
    expect(text).not.toContain('治愈');
  });
});
