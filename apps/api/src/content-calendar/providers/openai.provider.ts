import type {
  DayGenerationContext,
  GeneratedDayContent,
  RewriteHint,
  TextGenerationProvider,
} from './text-generation.provider';

// OpenAI 适配器。红线（Reviewer 确认口径）：
// ① 只发品牌名/行业/主题——绝不发用户聊天数据；
// ② 护栏在 service 层包在本 provider 外面，模型输出照样过禁词检查。
// 无 OPENAI_API_KEY 时不要实例化本类（AppModule 会退回模板 provider）。

export class OpenAIContentProvider implements TextGenerationProvider {
  readonly name = 'openai';

  constructor(
    private readonly apiKey: string,
    private readonly model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  ) {}

  async generateDay(
    ctx: DayGenerationContext,
    hint?: RewriteHint,
  ): Promise<GeneratedDayContent> {
    const guardNote = hint?.violations.length
      ? `\n\n注意：上一版内容因包含以下违禁表述被拦截，重写时必须避开（也不要使用同义的疗效承诺/诊断表述）：${hint.violations.join('、')}`
      : '';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.8,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              '你是一个大健康/疗愈品牌的私域运营内容专家。语气温暖、克制、像真人，' +
              '绝不使用医疗宣称（根治/治愈/包治/确诊等）、不做疗效承诺、不替代医疗建议。' +
              '输出 JSON：{"momentsPost":"朋友圈文案(80-140字)","groupTopic":"群话题(20-50字，以提问收尾)","dmScript":"一对一私信话术(40-90字，体贴不推销)"}',
          },
          {
            role: 'user',
            content:
              `品牌：${ctx.brandName}（${ctx.industry}）\n` +
              `本月主题：${ctx.monthTheme}\n` +
              `今天是第 ${ctx.dayIndex}/${ctx.totalDays} 天。` +
              `请生成今天的三段内容，围绕主题给出一件具体的"今天的小事"。${guardNote}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(
        `OpenAI API ${response.status}: ${await response.text()}`,
      );
    }
    const data = (await response.json()) as {
      choices: { message: { content: string } }[];
    };
    const parsed = JSON.parse(
      data.choices[0].message.content,
    ) as GeneratedDayContent;
    return {
      momentsPost: parsed.momentsPost ?? '',
      groupTopic: parsed.groupTopic ?? '',
      dmScript: parsed.dmScript ?? '',
    };
  }
}
