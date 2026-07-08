import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // demo 阶段：本机 web 演示壳跨端口访问 API
  app.enableCors({ origin: [/^http:\/\/localhost:\d+$/] });
  await app.listen(process.env.PORT ?? 3210);
}
void bootstrap();
