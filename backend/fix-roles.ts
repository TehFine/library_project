import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  await dataSource.query(`
    INSERT INTO roles (name, description) VALUES ('library_admin', 'Library Administrator') ON CONFLICT DO NOTHING;
    INSERT INTO roles (name, description) VALUES ('librarian', 'Librarian') ON CONFLICT DO NOTHING;
    INSERT INTO roles (name, description) VALUES ('reader', 'Reader') ON CONFLICT DO NOTHING;
  `);

  await dataSource.query(`
    UPDATE users SET "roleId" = (SELECT id FROM roles WHERE name = 'library_admin') WHERE email = 'admin@library.vn';
    UPDATE users SET "roleId" = (SELECT id FROM roles WHERE name = 'librarian') WHERE email = 'librarian@library.vn';
    UPDATE users SET "roleId" = (SELECT id FROM roles WHERE name = 'reader') WHERE email = 'reader@example.com';
  `);

  console.log('Roles fixed successfully.');
  await app.close();
}
bootstrap();
