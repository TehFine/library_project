process.env.TZ = 'Asia/Ho_Chi_Minh'

import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.setGlobalPrefix('api')

  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000']

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  })

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))

  // ── Swagger ────────────────────────────────────────────────────────
  const swaggerBuilder = new DocumentBuilder()
    .setTitle('Library Management System API')
    .setDescription('API quản lý thư viện với 3 vai trò: Reader, Librarian, Admin')
    .setVersion('1.0')
    .addServer(`http://localhost:${process.env.PORT ?? 3001}`, 'Local')

  if (process.env.RENDER_URL) {
    swaggerBuilder.addServer(process.env.RENDER_URL, 'Render')
  }

  const swaggerConfig = swaggerBuilder
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Nhập JWT token nhận được từ /api/auth/login' },
      'JWT-auth',
    )
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  })

  const port = process.env.PORT ?? 3001
  await app.listen(port)
  console.log(`\n🚀 Library API running at http://localhost:${port}/api`)
  console.log(`📖 Swagger docs at http://localhost:${port}/api/docs`)
  console.log('\n📋 Test accounts:')
  console.log('   Reader:    reader@example.com  / password123')
  console.log('   Librarian: librarian@library.vn / password123')
  console.log('   Admin:     admin@library.vn    / password123\n')
}
bootstrap()
