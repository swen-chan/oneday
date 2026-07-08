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
  let baseUrl: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    // 显式绑定 127.0.0.1 的随机端口并用真实 URL 请求：
    // 避免 supertest 隐式 listen 的 IPv4/IPv6 端口竞态（间歇 404 的根因，
    // 参见 nestjs/nest#15239——请求可能打到本机同端口号的其他服务上）
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  it('完整 demo 流程：导入 → 看板 → 内容日历', async () => {
    const importRes = await request(baseUrl)
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

    const dashRes = await request(baseUrl)
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

    const calRes = await request(baseUrl)
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

  it('demo seed：三个演示品牌，健康分各不相同，看板三层皆有数据', async () => {
    const seedRes = await request(baseUrl).post('/api/demo/seed').expect(201);
    const seedBody = seedRes.body as {
      brands: { id: string; groupId: string; memberCount: number }[];
    };
    expect(seedBody.brands).toHaveLength(3);

    const scores: number[] = [];
    for (const brand of seedBody.brands) {
      const dashRes = await request(baseUrl)
        .get(`/api/groups/${brand.groupId}/dashboard`)
        .expect(200);
      const dashBody = dashRes.body as { summary: Record<string, number> };
      expect(dashBody.summary.activeCount).toBeGreaterThan(0);
      expect(dashBody.summary.coolingCount).toBeGreaterThan(0);
      expect(dashBody.summary.sleepingCount).toBeGreaterThan(0);
      scores.push(dashBody.summary.healthScore);
    }
    // 多租户区分度：三个品牌健康分互不相同
    expect(new Set(scores).size).toBe(3);

    // 幂等：重复 seed 不产生重复品牌
    const again = await request(baseUrl).post('/api/demo/seed').expect(201);
    expect((again.body as { brands: unknown[] }).brands).toHaveLength(3);

    const listRes = await request(baseUrl).get('/api/brands').expect(200);
    expect((listRes.body as { brands: unknown[] }).brands).toHaveLength(3);
  });

  it('非法导入内容返回 400', async () => {
    await request(baseUrl)
      .post('/api/imports')
      .send({ groupName: 'g', filename: 'f.txt', content: '不是聊天记录' })
      .expect(400);
  });

  it('查询不存在的群返回 404', async () => {
    await request(baseUrl).get('/api/groups/nope/dashboard').expect(404);
  });
});
