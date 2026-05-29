// Run seed SQL for borrow stats
// Usage: node seed-borrow-stats.js

const { Client } = require('pg')
require('dotenv').config()

if (!process.env.DB_HOST || !process.env.DB_USERNAME || !process.env.DB_PASSWORD) {
  console.error('❌ Missing required env vars: DB_HOST, DB_USERNAME, DB_PASSWORD')
  console.error('   Please check your .env file')
  process.exit(1)
}

const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'postgres',
  ssl: { rejectUnauthorized: false },
})

async function main() {
  try {
    await client.connect()
    console.log('✅ Connected to database')
    
    // First check existing data
    const countResult = await client.query('SELECT COUNT(*)::int AS cnt FROM borrow_records')
    console.log(`📊 Existing borrow records: ${countResult.rows[0].cnt}`)
    
    // Get available copies for reference
    const copiesResult = await client.query('SELECT id, "bookId" FROM book_copies WHERE status = $1', ['available'])
    console.log(`📚 Available copies found: ${copiesResult.rows.length}`)
    
    if (copiesResult.rows.length === 0) {
      console.log('❌ No available copies found. Cannot create borrow records.')
      return
    }
    
    const cardId = 'b0000000-0000-4000-8000-000000000001'
    const librarianId = 'a0000000-0000-4000-8000-000000000002'
    let insertedCount = 0
    
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const date = new Date()
      date.setDate(date.getDate() - dayOffset)
      const dateStr = date.toISOString().split('T')[0]
      const dayOfWeek = date.getDay()
      
      let borrowsPerDay
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        borrowsPerDay = 1
      } else if (dayOffset < 7) {
        borrowsPerDay = 4
      } else {
        borrowsPerDay = 2 + Math.floor(Math.random() * 2)
      }
      
      for (let j = 0; j < borrowsPerDay; j++) {
        const copy = copiesResult.rows[Math.floor(Math.random() * copiesResult.rows.length)]
        
        try {
          // Use $1::date - dayOffset for the borrow date
          // Then use date arithmetic for dueDate and returnDate
          await client.query({
            text: `INSERT INTO borrow_records (id, "libraryCardId", "bookCopyId", "librarianId", "borrowDate", "dueDate", "returnDate", status, "createdAt")
                   VALUES (gen_random_uuid(), $1, $2, $3, CURRENT_DATE - $4::int, CURRENT_DATE - $4::int + 14, CURRENT_DATE - $4::int + floor(random() * 10)::int, 'returned', CURRENT_DATE - $4::int)`,
            values: [cardId, copy.id, librarianId, dayOffset]
          })
          insertedCount++
        } catch (err) {
          if (!err.message.includes('duplicate key')) {
            console.log(`  ⚠️  Insert error (day ${dayOffset}, copy ${j}): ${err.message}`)
          }
        }
      }
    }
    
    console.log(`✅ Inserted ${insertedCount} new borrow records`)
    
    // Update book copy counts
    await client.query(`
      UPDATE books b SET
        "totalCopies" = COALESCE((SELECT COUNT(*) FROM book_copies bc WHERE bc."bookId" = b.id AND bc.status IN ('available', 'borrowed')), 0),
        "availableCopies" = COALESCE((SELECT COUNT(*) FROM book_copies bc WHERE bc."bookId" = b.id AND bc.status = 'available'), 0)
    `)
    console.log('✅ Updated book counts')
    
    // Verify
    const finalCount = await client.query('SELECT COUNT(*)::int AS cnt FROM borrow_records')
    console.log(`📊 Final total borrow records: ${finalCount.rows[0].cnt}`)
    
    const stats = await client.query(`
      SELECT "borrowDate"::text, COUNT(*)::int AS count
      FROM borrow_records
      WHERE "borrowDate" >= CURRENT_DATE - 30
      GROUP BY "borrowDate"
      ORDER BY "borrowDate"
    `)
    console.log(`📊 Borrow stats for last 30 days: ${stats.rows.length} days with data`)
    stats.rows.forEach(r => {
      console.log(`   ${r.borrowDate}: ${r.count} lượt`)
    })
    
    const totalInRange = stats.rows.reduce((sum, r) => sum + r.count, 0)
    console.log(`\n📈 Total borrows in 30-day range: ${totalInRange} lượt`)
    
  } catch (err) {
    console.error('❌ Error:', err.message)
    console.error(err.stack)
    process.exit(1)
  } finally {
    await client.end()
    console.log('👋 Disconnected')
  }
}

main()
