// 文本生成 provider 端口（架构决策：业务模块不直接依赖厂商 SDK）。
// 实现：TemplateContentProvider（无 API key 的 fallback / 测试用）、
//       DeepSeekContentProvider（待 API key 到位后接入）。

export interface DayGenerationContext {
  brandName: string;
  industry: string;
  monthTheme: string;
  dayIndex: number; // 1-based
  totalDays: number;
}

export interface GeneratedDayContent {
  momentsPost: string; // 朋友圈文案
  groupTopic: string; // 群话题
  dmScript: string; // 私信话术
}

/** 护栏命中后的重写提示：把违规表述回喂给 provider 做定向改写。 */
export interface RewriteHint {
  violations: string[];
}

export interface TextGenerationProvider {
  readonly name: string;
  generateDay(
    ctx: DayGenerationContext,
    hint?: RewriteHint,
  ): Promise<GeneratedDayContent>;
}
