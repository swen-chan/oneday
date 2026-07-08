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

  /** demo 模式：一键填充合成群数据（走真实解析管线，与真实导入同一条代码路径）。 */
  @Post('demo/seed')
  seedDemo() {
    const exportText = generateSyntheticExport({
      memberCount: 40,
      days: 60,
      endDate: new Date(),
      seed: 42,
    });
    const parsed = parseWeChatExport(exportText, { groupId: 'demo-jing' });
    const group = this.store.createGroup('演示群 · JING私域');
    const record = this.store.applyImport(group, 'synthetic-demo.txt', parsed);
    return {
      groupId: group.id,
      note: '合成演示数据（非真实用户）',
      import: {
        messageCount: record.messageCount,
        memberCount: record.memberCount,
      },
    };
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
    return {
      groupId: group.id,
      groupName: group.name,
      referenceDate: group.latestPeriodEnd,
      ...result,
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
