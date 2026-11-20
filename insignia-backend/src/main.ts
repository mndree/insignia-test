import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Increase payload limit for photo uploads
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Enable CORS
  app.enableCors();

  // Swagger Documentation Setup with Bearer Authentication
  const config = new DocumentBuilder()
    .setTitle('Crypto Wallet Offline Assignment API')
    .setDescription(
      'REST API with Admin Login and Bearer Token Authorization for Wallet and Transaction management.\n\n' +
      '### How to Authorize in Swagger UI:\n' +
      '1. Go to **Admin API** -> `POST /admin/login`\n' +
      '2. Use username: `admin`, password: `admin123` (or register a new admin)\n' +
      '3. Copy the returned `token`\n' +
      '4. Click the green **Authorize 🔓** button at the top right of this page\n' +
      '5. Paste the token and click **Authorize**\n' +
      '6. All protected routes will now automatically use the Admin Bearer token!',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your Admin Bearer Token from POST /admin/login',
        in: 'header',
      },
      'admin-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const swaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
    },
  };
  SwaggerModule.setup('docs', app, document, swaggerCustomOptions);
  SwaggerModule.setup('api/docs', app, document, swaggerCustomOptions);

  // Redirect root '/' directly to Swagger UI
  app.getHttpAdapter().get('/', (_req, res) => {
    res.redirect('/docs');
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📖 Swagger documentation is available at: http://localhost:${port}/docs`);
}

await bootstrap();
