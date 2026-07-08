import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiController } from './api.controller';
import { InMemoryStore } from './store/in-memory.store';
import { ContentCalendarService } from './content-calendar/content-calendar.service';
import { TemplateContentProvider } from './content-calendar/providers/template.provider';
import { OpenAIContentProvider } from './content-calendar/providers/openai.provider';

@Module({
  imports: [],
  controllers: [AppController, ApiController],
  providers: [
    AppService,
    InMemoryStore,
    {
      // 文本生成 provider 可切换：有 OPENAI_API_KEY 用 OpenAI（demo 决策 2026-07-08），
      // 缺省走模板 fallback（不依赖外部服务与密钥）。将来国内部署换国产模型 = 再加一个 adapter。
      provide: ContentCalendarService,
      useFactory: () => {
        const openaiKey = process.env.OPENAI_API_KEY;
        const provider = openaiKey
          ? new OpenAIContentProvider(openaiKey)
          : new TemplateContentProvider();
        return new ContentCalendarService(provider);
      },
    },
  ],
})
export class AppModule {}
