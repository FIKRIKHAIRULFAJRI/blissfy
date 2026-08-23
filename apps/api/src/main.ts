import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT', 3002);
  const storeUrl = configService.get<string>(
    'STORE_URL',
    'http://localhost:3000',
  );
  const adminUrl = configService.get<string>(
    'ADMIN_URL',
    'http://localhost:3001',
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: [storeUrl, adminUrl],
    credentials: true,
  });

  await app.listen(port);
}

void bootstrap();
