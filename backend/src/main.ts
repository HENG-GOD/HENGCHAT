import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    bodyParser: false,
  });

  // Capture raw body for LINE webhook signature verification
  app.use(
    json({
      verify: (req: any, _res, buf) => {
        if (Buffer.isBuffer(buf)) req.rawBody = Buffer.from(buf);
      },
      limit: '10mb',
    }),
  );
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  app.setGlobalPrefix('api', { exclude: ['webhook/(.*)'] });
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const config = app.get(ConfigService);
  const port = config.get<number>('port', 4000);
  await app.listen(port);
  Logger.log(`HENGCHAT backend listening on :${port}`, 'Bootstrap');
}
bootstrap();
