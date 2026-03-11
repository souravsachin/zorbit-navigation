import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  // OpenTelemetry must be initialized before the app starts
  initOpenTelemetry();

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Zorbit Navigation')
    .setDescription('Dynamic navigation menu management, route registration, and per-user menu generation based on roles and privileges.')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('menus', 'Menu item management within organizations')
    .addTag('routes', 'Route registration within organizations')
    .addTag('navigation-resolver', 'Resolved navigation for users based on privileges')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3003);

  await app.listen(port);
  console.log(`zorbit-navigation service listening on port ${port}`);
}

function initOpenTelemetry(): void {
  // TODO: Initialize OpenTelemetry SDK when @opentelemetry/sdk-node is configured
  // const sdk = new NodeSDK({
  //   serviceName: process.env.OTEL_SERVICE_NAME || 'zorbit-navigation',
  //   traceExporter: new OTLPTraceExporter({
  //     url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  //   }),
  // });
  // sdk.start();
}

bootstrap();
