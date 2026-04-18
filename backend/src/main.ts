import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.setGlobalPrefix('api')

  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  })

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))

  const port = process.env.PORT ?? 3001
  await app.listen(port)
  console.log(`\n🚀 Library API running at http://localhost:${port}/api`)
  console.log('\n📋 Test accounts:')
  console.log('   Reader:    reader@example.com  / password123')
  console.log('   Librarian: librarian@library.vn / password123')
  console.log('   Admin:     admin@library.vn    / password123\n')
}
bootstrap()