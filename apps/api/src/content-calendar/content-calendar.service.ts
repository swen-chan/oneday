import { z } from 'zod';
import { findForbiddenClaims } from '../guardrails/guardrails';
import type {
  GeneratedDayContent,
  TextGenerationProvider,
} from './providers/text-generation.provider';

const RequestSchema = z.object({
  brandName: z.string().min(1),
  industry: z.string().min(1),
  monthTheme: z.string().min(1),
  days: z.number().int().min(1).max(31),
});

export type ContentCalendarRequest = z.infer<typeof RequestSchema>;

export interface ContentCalendarPackage {
  brandName: string;
  monthTheme: string;
  generatedBy: string;
  days: (GeneratedDayContent & { dayIndex: number })[];
  /** 连续未过护栏的天：只标记，不放行脏内容，也不中断其余天（finding 3） */
  failedDays: { dayIndex: number; reason: string }[];
}

const MAX_REWRITE_ATTEMPTS = 2;
const MOMENTS_MAX_LENGTH = 300;

export class ContentCalendarService {
  constructor(private readonly provider: TextGenerationProvider) {}

  async generate(
    rawRequest: ContentCalendarRequest,
  ): Promise<ContentCalendarPackage> {
    const request = RequestSchema.parse(rawRequest);
    const days: ContentCalendarPackage['days'] = [];
    const failedDays: ContentCalendarPackage['failedDays'] = [];

    for (let dayIndex = 1; dayIndex <= request.days; dayIndex++) {
      const outcome = await this.generateDayWithGuardrails(request, dayIndex);
      if ('content' in outcome) {
        days.push({ dayIndex, ...outcome.content });
      } else {
        failedDays.push({ dayIndex, reason: outcome.reason });
      }
    }

    if (days.length === 0) {
      throw new Error(
        `全部 ${request.days} 天内容均未通过护栏检查：${failedDays[0]?.reason ?? ''}`,
      );
    }

    return {
      brandName: request.brandName,
      monthTheme: request.monthTheme,
      generatedBy: this.provider.name,
      days,
      failedDays,
    };
  }

  /**
   * 生成 + 护栏：命中禁词时把违规表述回喂给 provider 定向改写（finding 3）；
   * 连续失败只标记该天，绝不放行脏内容。
   */
  private async generateDayWithGuardrails(
    request: ContentCalendarRequest,
    dayIndex: number,
  ): Promise<{ content: GeneratedDayContent } | { reason: string }> {
    let lastViolations: string[] = [];
    for (let attempt = 0; attempt <= MAX_REWRITE_ATTEMPTS; attempt++) {
      let content: GeneratedDayContent;
      try {
        content = await this.provider.generateDay(
          {
            brandName: request.brandName,
            industry: request.industry,
            monthTheme: request.monthTheme,
            dayIndex,
            totalDays: request.days,
          },
          { violations: lastViolations },
        );
      } catch (e) {
        // provider 故障（如 API 超时）与护栏命中同样按"该天失败"隔离
        lastViolations = [`provider 错误: ${(e as Error).message}`];
        continue;
      }

      const violations = this.checkDay(content);
      if (violations.length === 0) return { content };
      lastViolations = violations;
    }
    return {
      reason: `连续 ${MAX_REWRITE_ATTEMPTS + 1} 次未通过护栏检查（${lastViolations.join('；')}）`,
    };
  }

  private checkDay(content: GeneratedDayContent): string[] {
    const violations: string[] = [];
    const fields: [string, string][] = [
      ['momentsPost', content.momentsPost],
      ['groupTopic', content.groupTopic],
      ['dmScript', content.dmScript],
    ];
    for (const [field, text] of fields) {
      const hits = findForbiddenClaims(text);
      if (hits.length > 0) violations.push(`${field}: ${hits.join('/')}`);
      if (!text || text.trim().length === 0)
        violations.push(`${field}: 空内容`);
    }
    if (content.momentsPost.length > MOMENTS_MAX_LENGTH) {
      violations.push(`momentsPost: 超长（${content.momentsPost.length} 字）`);
    }
    return violations;
  }
}
