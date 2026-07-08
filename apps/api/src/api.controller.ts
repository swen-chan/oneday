import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { z } from 'zod';
import {
  parseWeChatExport,
  type ParsedExport,
} from './chat-import/chat-parser';
import { layerMembers } from './dashboard/member-layering';
import { buildDisplayNames } from './dashboard/display-names';
import { generateSyntheticExport } from './demo/synthetic-data';
import { ContentCalendarService } from './content-calendar/content-calendar.service';
import { InMemoryStore } from './store/in-memory.store';

const ImportRequestSchema = z.object({
  groupName: z.string().min(1),
  filename: z.string().min(1),
  content: z.string().min(1),
});

const CalendarRequestSchema = z.object({
  brandName: z.string().min(1),
  industry: z.string().min(1),
  monthTheme: z.string().min(1),
  days: z.number().int().min(1).max(31).default(7),
});

@Controller('api')
export class ApiController {
  constructor(
    private readonly store: InMemoryStore,
    private readonly contentCalendar: ContentCalendarService,
  ) {}

  /** 上传群聊天记录（文本）→ 解析（即脱敏）→ 入库 → 返回导入摘要。原始文本不保存。 */
  @Post('imports')
  createImport(@Body() body: unknown) {
    const request = this.parse(ImportRequestSchema, body);
    let parsed: ParsedExport;
    try {
      parsed = parseWeChatExport(request.content, {
        groupId: request.groupName,
      });
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
    const group = this.store.createGroup(request.groupName);
    const record = this.store.applyImport(group, request.filename, parsed);
    return {
      groupId: group.id,
      import: {
        id: record.id,
        messageCount: record.messageCount,
        memberCount: record.memberCount,
        periodStart: record.periodStart,
        periodEnd: record.periodEnd,
      },
    };
  }

  /**
   * demo 模式：一键填充 3 个演示品牌（多租户叙事），每个品牌一个群、
   * 不同的画像配比（健康分各不相同）。走真实解析管线。幂等：已有品牌则直接返回。
   */
  @Post('demo/seed')
  seedDemo() {
    if (this.store.listBrands().length === 0) {
      const presets = [
        {
          name: 'JING 疗愈',
          industry: '疗愈个人 IP',
          tagline: '一对一陪伴 + 月度主题营',
          defaultTheme: '睡眠修复 · 深度休息',
          groupName: 'JING 创始会员群',
          seed: 42,
          memberCount: 40,
          mix: { active: 0.5, cooling: 0.25 },
        },
        {
          name: '山语疗愈民宿',
          industry: '疗愈民宿',
          tagline: '住客离店后的持续陪伴',
          defaultTheme: '秋日静养 · 回到身体',
          groupName: '山语住客群',
          seed: 7,
          memberCount: 36,
          mix: { active: 0.22, cooling: 0.3 },
        },
        {
          name: '绿原公益基金会',
          industry: '公益组织',
          tagline: '社区环保项目私域',
          defaultTheme: '社区环保 · 微行动',
          groupName: '绿原志愿者群',
          seed: 13,
          memberCount: 60,
          mix: { active: 0.62, cooling: 0.2 },
        },
      ];
      for (const p of presets) {
        const brand = this.store.createBrand({
          name: p.name,
          industry: p.industry,
          tagline: p.tagline,
          defaultTheme: p.defaultTheme,
        });
        const exportText = generateSyntheticExport({
          memberCount: p.memberCount,
          days: 60,
          endDate: new Date(),
          seed: p.seed,
          profileMix: p.mix,
        });
        const parsed = parseWeChatExport(exportText, { groupId: brand.id });
        const group = this.store.createGroup(p.groupName, brand.id);
        this.store.applyImport(group, 'synthetic-demo.txt', parsed);
      }
    }
    return {
      note: '合成演示数据（非真实用户）',
      brands: this.listBrandSummaries(),
    };
  }

  /** 品牌列表（演示登录页数据源）。 */
  @Get('brands')
  brands() {
    return { brands: this.listBrandSummaries() };
  }

  private listBrandSummaries() {
    return this.store.listBrands().map((b) => ({
      id: b.id,
      name: b.name,
      industry: b.industry,
      tagline: b.tagline,
      defaultTheme: b.defaultTheme,
      groupId: b.groupIds[0] ?? null,
      memberCount: b.groupIds.reduce(
        (sum, gid) => sum + this.store.memberCountOf(gid),
        0,
      ),
    }));
  }

  /** 私域健康看板：成员分层 + 健康分。referenceDate = 数据的 periodEnd（结果可复现）。 */
  @Get('groups/:id/dashboard')
  dashboard(@Param('id') id: string) {
    const group = this.store.findGroup(id);
    if (!group) throw new NotFoundException(`group ${id} 不存在`);
    if (!group.latestPeriodEnd)
      throw new BadRequestException('该群还没有导入数据');
    const result = layerMembers(
      [...group.members.values()],
      group.latestPeriodEnd,
    );
    // 展示层化名：与底层代号 1:1（撞名附完整代号消歧），数据层不变
    const displayNames = buildDisplayNames(
      [...group.members.values()].map((m) => m.alias),
    );
    const withNames = (
      members: { alias: string; lastActiveAt: Date; messageCount: number }[],
    ) =>
      members.map((m) => ({
        ...m,
        displayName: displayNames.get(m.alias) ?? m.alias,
      }));
    return {
      groupId: group.id,
      groupName: group.name,
      referenceDate: group.latestPeriodEnd,
      layers: {
        active: withNames(result.layers.active),
        cooling: withNames(result.layers.cooling),
        sleeping: withNames(result.layers.sleeping),
      },
      summary: result.summary,
    };
  }

  /** 内容日历生成（出站前已过护栏）。 */
  @Post('content-calendar')
  async generateCalendar(@Body() body: unknown) {
    const request = this.parse(CalendarRequestSchema, body);
    return this.contentCalendar.generate(request);
  }

  private parse<T>(schema: z.ZodType<T>, body: unknown): T {
    const result = schema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(
        result.error.issues.map((i) => i.message).join('; '),
      );
    }
    return result.data;
  }
}
