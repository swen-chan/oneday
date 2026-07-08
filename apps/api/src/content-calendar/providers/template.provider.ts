import type {
  DayGenerationContext,
  GeneratedDayContent,
  TextGenerationProvider,
} from './text-generation.provider';

// 模板 provider：无 LLM key 时的 fallback，也是单测的确定性实现。
// 文案骨架来自 One Day 方法论（今天的一件小事 / 陪伴感 / 不施压）。

const ANGLES = [
  { focus: '开始', act: '给自己五分钟，安安静静做一件小事' },
  { focus: '觉察', act: '留意一下此刻身体的感觉，不评判' },
  { focus: '节奏', act: '把今天的节奏放慢半拍' },
  { focus: '记录', act: '写下一句今天想对自己说的话' },
  { focus: '陪伴', act: '在群里说说你的今天，我们都在' },
  { focus: '感受', act: '睡前回想一个让你安心的瞬间' },
  { focus: '延续', act: '把这周最舒服的一个习惯带进明天' },
];

export class TemplateContentProvider implements TextGenerationProvider {
  readonly name = 'template';

  generateDay(ctx: DayGenerationContext): Promise<GeneratedDayContent> {
    const angle = ANGLES[(ctx.dayIndex - 1) % ANGLES.length];
    return Promise.resolve({
      momentsPost:
        `【${ctx.monthTheme} · 第${ctx.dayIndex}天】${angle.act}。` +
        `${ctx.brandName}想陪你把「${ctx.monthTheme}」过成日常——` +
        `不用做到完美，今天有今天的${angle.focus}就好。`,
      groupTopic: `今天想和大家聊聊「${angle.focus}」：${angle.act}，你会选什么时间做？`,
      dmScript:
        `最近${ctx.monthTheme}这个主题进行到第${ctx.dayIndex}天了，` +
        `想到你之前提过的状态，这个练习（${angle.act}）也许适合你，有空可以试试，不急。`,
    });
  }
}
