import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { AdminService } from './src/modules/admin/admin.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(AdminService);
  try {
      const stats = await service.getDashboardStats();
      console.log('SUCCESS');
  } catch (err) {
      console.error('ERROR:', err);
  }
  await app.close();
}
bootstrap();
