import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { AdminService } from './src/modules/admin/admin.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(AdminService);
  try {
      const reports = await service.getBookReports();
      console.log('SUCCESS - topBorrowed:', reports.topBorrowed.length);
      console.log('SUCCESS - stockStatus:', reports.stockStatus.length);
      console.log('SUCCESS - replenishment:', reports.replenishment.length);
      console.log('SUCCESS - disposal:', reports.disposal.length);
      if (reports.topBorrowed.length > 0) {
        console.log('Sample:', JSON.stringify(reports.topBorrowed[0], null, 2));
      }
  } catch (err) {
      console.error('ERROR:', err.message);
      console.error('Stack:', err.stack);
  }
  await app.close();
}
bootstrap();
