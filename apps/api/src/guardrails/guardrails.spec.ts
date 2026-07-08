import {
  findForbiddenClaims,
  maskPhoneNumbers,
  maskWeChatIds,
  anonymizeDisplayName,
} from './guardrails';

// 验收契约（#oneday 2026-07-08 锁定）：AI 生成内容禁医疗/疗效宣称；
// 真实数据入库/展示前脱敏。这里是全系统的护栏原语，纯函数、TDD 全覆盖。

describe('findForbiddenClaims 医疗/疗效宣称检测', () => {
  it('放行正常养生内容', () => {
    expect(findForbiddenClaims('每天揉腹五分钟，给自己一点安静的时间')).toEqual(
      [],
    );
  });

  it('检出疗效承诺词', () => {
    const hits = findForbiddenClaims('坚持打卡，根治失眠，7天治愈脾胃虚寒');
    expect(hits).toEqual(expect.arrayContaining(['根治', '治愈']));
  });

  it('检出诊断式表述', () => {
    expect(findForbiddenClaims('你这是典型的抑郁症，需要马上调理')).toContain(
      '抑郁症',
    );
  });

  it('检出夸大功效词', () => {
    const hits = findForbiddenClaims('本方法包治百病，药到病除');
    expect(hits.length).toBeGreaterThan(0);
  });

  it('对空字符串返回空数组', () => {
    expect(findForbiddenClaims('')).toEqual([]);
  });
});

describe('maskPhoneNumbers 手机号脱敏', () => {
  it('脱敏大陆手机号', () => {
    expect(maskPhoneNumbers('我的电话是13812345678，随时联系')).toBe(
      '我的电话是138****5678，随时联系',
    );
  });

  it('同时脱敏多个手机号', () => {
    const out = maskPhoneNumbers('主号13812345678备用15987654321');
    expect(out).not.toContain('13812345678');
    expect(out).not.toContain('15987654321');
  });

  it('不误伤普通数字', () => {
    expect(maskPhoneNumbers('订单号20260708001，金额499元')).toBe(
      '订单号20260708001，金额499元',
    );
  });
});

describe('maskWeChatIds 微信号脱敏', () => {
  it('脱敏"微信号：xxx"模式', () => {
    const out = maskWeChatIds('加我微信：jing_healing2026 详聊');
    expect(out).not.toContain('jing_healing2026');
    expect(out).toContain('微信：');
  });

  it('不改动无微信号的文本', () => {
    const text = '今天的冥想练习大家完成得很好';
    expect(maskWeChatIds(text)).toBe(text);
  });
});

describe('anonymizeDisplayName 成员名脱敏', () => {
  it('同一名字生成稳定代号', () => {
    const a = anonymizeDisplayName('王小美', 'group-1');
    const b = anonymizeDisplayName('王小美', 'group-1');
    expect(a).toBe(b);
  });

  it('不同名字生成不同代号', () => {
    expect(anonymizeDisplayName('王小美', 'group-1')).not.toBe(
      anonymizeDisplayName('李大力', 'group-1'),
    );
  });

  it('同名在不同群生成不同代号（防跨群关联）', () => {
    expect(anonymizeDisplayName('王小美', 'group-1')).not.toBe(
      anonymizeDisplayName('王小美', 'group-2'),
    );
  });

  it('代号不含原名信息', () => {
    const alias = anonymizeDisplayName('王小美', 'group-1');
    expect(alias).not.toContain('王');
    expect(alias).toMatch(/^成员[A-Z0-9]{4}$/);
  });
});
