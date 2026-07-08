import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let baseUrl: string;

  beforeEach(async () => {
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

  it('/ (GET)', () => {
    return request(baseUrl)
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  afterEach(async () => {
    await app.close();
  });
});
