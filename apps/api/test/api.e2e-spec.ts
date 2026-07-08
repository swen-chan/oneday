import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// API 层 e2e：完整走一遍 demo 流程（上传 → 看板 → 内容日历）。
// fixture 为合成数据（demo-first：不入真实聊天）。

const SYNTHETIC_EXPORT = `2026-06-01 09:00:00 成员甲
大家早上好，开始今天的练习

2026-06-20 10:00:00 成员乙
最近状态好多了

2026-07-06 08:30:00 成员甲
今天也来打卡
`;

describe('Platform API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('完整 demo 流程：导入 → 看板 → 内容日历', async () => {
    const importRes = await request(app.getHttpServer())
      .post('/api/imports')
      .send({
        groupName: 'JING疗愈群',
        filename: 'export.txt',
        content: SYNTHETIC_EXPORT,
      })
      .expect(201);

    const importBody = importRes.body as {
      groupId: string;
      import: { messageCount: number; memberCount: number };
    };
    expect(importBody.import.messageCount).toBe(3);
    expect(importBody.import.memberCount).toBe(2);
    const groupId = importBody.groupId;

    const dashRes = await request(app.getHttpServer())
      .get(`/api/groups/${groupId}/dashboard`)
      .expect(200);

    const dashBody = dashRes.body as { summary: Record<string, number> };
    // referenceDate = periodEnd(7/6)：成员甲 2 天前活跃 → active；成员乙 16 天 → cooling
    expect(dashBody.summary).toMatchObject({
      total: 2,
      activeCount: 1,
      coolingCount: 1,
      sleepingCount: 0,
      healthScore: 75,
    });
    // 看板输出不得出现任何原始昵称
    expect(JSON.stringify(dashRes.body)).not.toContain('成员甲');

    const calRes = await request(app.getHttpServer())
      .post('/api/content-calendar')
      .send({
        brandName: 'JING',
        industry: '疗愈',
        monthTheme: '睡眠修复',
        days: 3,
      })
      .expect(201);

    const calBody = calRes.body as { days: unknown[]; generatedBy: string };
    expect(calBody.days).toHaveLength(3);
    expect(calBody.generatedBy).toBe('template');
  });

  it('demo seed：一键填充后看板三层皆有数据', async () => {
    const seedRes = await request(app.getHttpServer())
      .post('/api/demo/seed')
      .expect(201);
    const seedBody = seedRes.body as {
      groupId: string;
      import: { memberCount: number };
    };
    expect(seedBody.import.memberCount).toBe(40);

    const dashRes = await request(app.getHttpServer())
      .get(`/api/groups/${seedBody.groupId}/dashboard`)
      .expect(200);
    const dashBody = dashRes.body as { summary: Record<string, number> };
    expect(dashBody.summary.activeCount).toBeGreaterThan(0);
    expect(dashBody.summary.coolingCount).toBeGreaterThan(0);
    expect(dashBody.summary.sleepingCount).toBeGreaterThan(0);
  });

  it('非法导入内容返回 400', async () => {
    await request(app.getHttpServer())
      .post('/api/imports')
      .send({ groupName: 'g', filename: 'f.txt', content: '不是聊天记录' })
      .expect(400);
  });

  it('查询不存在的群返回 404', async () => {
    await request(app.getHttpServer())
      .get('/api/groups/nope/dashboard')
      .expect(404);
  });
});
