import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupTracing } from './tracing';

async function bootstrap() {
  setupTracing();
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
