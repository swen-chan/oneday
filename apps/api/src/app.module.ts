import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiController } from './api.controller';
import { InMemoryStore } from './store/in-memory.store';
import { ContentCalendarService } from './content-calendar/content-calendar.service';
import { TemplateContentProvider } from './content-calendar/providers/template.provider';

@Module({
  imports: [],
  controllers: [AppController, ApiController],
  providers: [
    AppService,
    InMemoryStore,
    {
      // 文本生成 provider：有 DEEPSEEK_API_KEY 时后续替换为 DeepSeek 实现，
      // 缺省走模板 fallback（demo 不依赖外部服务与密钥）
      provide: ContentCalendarService,
      useFactory: () =>
        new ContentCalendarService(new TemplateContentProvider()),
    },
  ],
})
export class AppModule {}
