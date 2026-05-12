import { DataSource } from 'typeorm'
import * as dotenv from 'dotenv'
dotenv.config()

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: { rejectUnauthorized: false },
})

ds.initialize().then(async () => {
  const r = await ds.query('SELECT b.title, b."categoryId", c.name as cat_name FROM books b LEFT JOIN categories c ON b."categoryId" = c.id LIMIT 10')
  console.log('Books samples:', r)
  
  const cats = await ds.query('SELECT * FROM categories')
  console.log('Categories:', cats)
  
  await ds.destroy()
}).catch(e => {
  console.error(e)
  process.exit(1)
})
