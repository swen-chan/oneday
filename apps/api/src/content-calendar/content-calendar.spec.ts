import { ContentCalendarService } from './content-calendar.service';
import { TemplateContentProvider } from './providers/template.provider';
import type { TextGenerationProvider } from './providers/text-generation.provider';

// 模块 3：内容日历生成（冲刺文档 MVP 定义）。
// 输入：品牌行业 + 月度主题 → 输出：7 天内容包（朋友圈文案/群话题/私信话术）。
// 验收契约：AI 生成走护栏测试——结构/长度校验 + 禁词过滤，不做精确文案断言。

const request = {
  brandName: '山语疗愈民宿',
  industry: '疗愈民宿',
  monthTheme: '睡眠修复·深度休息',
  days: 7,
};

describe('ContentCalendarService（模板 fallback provider）', () => {
  const service = new ContentCalendarService(new TemplateContentProvider());

  it('生成请求天数的内容包', async () => {
    const pkg = await service.generate(request);
    expect(pkg.days).toHaveLength(7);
  });

  it('每天包含三种内容且非空', async () => {
    const pkg = await service.generate(request);
    for (const day of pkg.days) {
      expect(day.momentsPost.length).toBeGreaterThan(20);
      expect(day.groupTopic.length).toBeGreaterThan(5);
      expect(day.dmScript.length).toBeGreaterThan(10);
    }
  });

  it('内容引用品牌与主题上下文', async () => {
    const pkg = await service.generate(request);
    const all = pkg.days.map((d) => d.momentsPost + d.groupTopic + d.dmScript).join('');
    expect(all).toContain('睡眠');
  });

  it('朋友圈文案长度适配平台（≤300 字）', async () => {
    const pkg = await service.generate(request);
    for (const day of pkg.days) {
      expect(day.momentsPost.length).toBeLessThanOrEqual(300);
    }
  });

  it('拒绝非法天数', async () => {
    await expect(service.generate({ ...request, days: 0 })).rejects.toThrow();
    await expect(service.generate({ ...request, days: 32 })).rejects.toThrow();
  });
});

describe('ContentCalendarService 护栏', () => {
  it('provider 输出含禁词时拦截该天并要求重写，最终产物无禁词', async () => {
    let call = 0;
    const dirtyOnce: TextGenerationProvider = {
      name: 'dirty-once',
      async generateDay(ctx) {
        call += 1;
        if (call === 1) {
          return {
            momentsPost: '七天根治失眠！立刻报名，这个方法保证见效'.padEnd(30, '。'),
            groupTopic: '今晚聊聊怎么根治失眠',
            dmScript: '姐，我们这个营包治百病，你来试试',
          };
        }
        return new TemplateContentProvider().generateDay(ctx);
      },
    };
    const service = new ContentCalendarService(dirtyOnce);
    const pkg = await service.generate({ ...request, days: 1 });
    const all = pkg.days[0].momentsPost + pkg.days[0].groupTopic + pkg.days[0].dmScript;
    expect(all).not.toContain('根治');
    expect(all).not.toContain('包治百病');
  });

  it('provider 连续输出禁词时抛出且不产出脏内容', async () => {
    const alwaysDirty: TextGenerationProvider = {
      name: 'always-dirty',
      async generateDay() {
        return {
          momentsPost: '根治失眠的秘密方法'.padEnd(30, '。'),
          groupTopic: '治愈一切',
          dmScript: '确诊了也不用去医院',
        };
      },
    };
    const service = new ContentCalendarService(alwaysDirty);
    await expect(service.generate({ ...request, days: 1 })).rejects.toThrow(/护栏/);
  });
});
