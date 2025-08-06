import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:5173', // Your React app's URL
    credentials: true, // Needed if you send cookies or auth headers
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown properties
      forbidNonWhitelisted: true, // 400 if extra fields are sent (e.g., "username")
      transform: true, // auto-transform primitives (e.g., "id" param to number)
    }),
  );

  await app.listen(3000);
}
bootstrap();
