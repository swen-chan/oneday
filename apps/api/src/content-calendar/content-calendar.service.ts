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
}

const MAX_REWRITE_ATTEMPTS = 2;
const MOMENTS_MAX_LENGTH = 300;

export class ContentCalendarService {
  constructor(private readonly provider: TextGenerationProvider) {}

  async generate(rawRequest: ContentCalendarRequest): Promise<ContentCalendarPackage> {
    const request = RequestSchema.parse(rawRequest);
    const days: ContentCalendarPackage['days'] = [];

    for (let dayIndex = 1; dayIndex <= request.days; dayIndex++) {
      days.push({ dayIndex, ...(await this.generateDayWithGuardrails(request, dayIndex)) });
    }

    return {
      brandName: request.brandName,
      monthTheme: request.monthTheme,
      generatedBy: this.provider.name,
      days,
    };
  }

  /** 生成 + 护栏：命中禁词则重试；连续失败即抛错，绝不放行脏内容。 */
  private async generateDayWithGuardrails(
    request: ContentCalendarRequest,
    dayIndex: number,
  ): Promise<GeneratedDayContent> {
    for (let attempt = 0; attempt <= MAX_REWRITE_ATTEMPTS; attempt++) {
      const content = await this.provider.generateDay({
        brandName: request.brandName,
        industry: request.industry,
        monthTheme: request.monthTheme,
        dayIndex,
        totalDays: request.days,
      });

      const violations = this.checkDay(content);
      if (violations.length === 0) return content;
    }
    throw new Error(`第${dayIndex}天内容连续 ${MAX_REWRITE_ATTEMPTS + 1} 次未通过护栏检查`);
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
      if (!text || text.trim().length === 0) violations.push(`${field}: 空内容`);
    }
    if (content.momentsPost.length > MOMENTS_MAX_LENGTH) {
      violations.push(`momentsPost: 超长（${content.momentsPost.length} 字）`);
    }
    return violations;
  }
}
