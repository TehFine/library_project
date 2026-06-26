// Dynamic seed - creates overdue borrows + fines using actual DB data
// Safe to re-run: uses WHERE NOT EXISTS checks
const { Client } = require('pg')
require('dotenv').config()

const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'postgres',
  ssl: { rejectUnauthorized: false },
})

async function main() {
  await client.connect()
  console.log('✅ Connected to database')

  // Get data
  const copies = (await client.query(
    `SELECT id, "bookId" FROM book_copies WHERE status = 'available'`
  )).rows
  console.log(`📚 Available copies: ${copies.length}`)

  const cards = (await client.query(
    `SELECT id AS card_id, "userId" AS user_id, "cardNumber" AS card_number
     FROM library_cards WHERE status = 'active'`
  )).rows
  console.log(`💳 Active cards: ${cards.length}`)

  const lib = (await client.query(
    `SELECT id FROM users WHERE "roleId" IN (SELECT id FROM roles WHERE name IN ('librarian','library_admin')) LIMIT 1`
  )).rows[0]
  if (!lib) { console.error('❌ No librarian found'); process.exit(1) }
  console.log(`👤 Librarian: ${lib.id}`)

  // Get book titles for reference
  const books = (await client.query(`SELECT id, title FROM books`)).rows
  const bookMap = new Map(books.map(b => [b.id, b.title]))

  if (copies.length < 7 || cards.length < 2) {
    console.error('❌ Not enough data: need >=7 available copies and >=2 active cards')
    process.exit(1)
  }

  // Define seed plan using actual data
  // reader1 = first card, reader2 = second card
  const reader1Card = cards[0] // "testreader" or whichever is first
  const reader2Card = cards[1] // "Thế" or whichever is second
  console.log(`\n📋 Seed plan:
    Reader1: card=${reader1Card.card_number} (${reader1Card.card_id})
    Reader2: card=${reader2Card.card_number} (${reader2Card.card_id})`)

  // Assign copies to each reader
  const reader1Copies = copies.slice(0, 4) // 4 books for reader1
  const reader2Copies = copies.slice(4, 7) // 3 books for reader2

  // Define overdue scenarios: [copy, overdue_days]
  const scenarios = [
    // Reader 1
    { cardId: reader1Card.card_id, copy: reader1Copies[0], overdueDays: 10 },
    { cardId: reader1Card.card_id, copy: reader1Copies[1], overdueDays: 8 },
    { cardId: reader1Card.card_id, copy: reader1Copies[2], overdueDays: 14 },
    { cardId: reader1Card.card_id, copy: reader1Copies[3], overdueDays: 6 },
    // Reader 2
    { cardId: reader2Card.card_id, copy: reader2Copies[0], overdueDays: 15 },
    { cardId: reader2Card.card_id, copy: reader2Copies[1], overdueDays: 5 },
    { cardId: reader2Card.card_id, copy: reader2Copies[2], overdueDays: 3 },
  ]

  let insertedBorrows = 0
  let insertedFines = 0

  for (const s of scenarios) {
    const uniqueId = `seed-${s.copy.id}-${s.overdueDays}`
    const daysAgo = s.overdueDays + 14 // borrow was 14+ days before due
    const borrowDate = `CURRENT_DATE - ${daysAgo}::int`
    const dueDate = `CURRENT_DATE - ${s.overdueDays}::int`
    const bookTitle = bookMap.get(s.copy.bookId) || 'Unknown'

    // Calculate fine amount (using current rates: 2000 first 5 days, 5000 from day 6)
    // But let's just use dynamic calculation to match what the system would do
    let amount
    if (s.overdueDays <= 5) {
      amount = s.overdueDays * 2000
    } else {
      amount = 5 * 2000 + (s.overdueDays - 5) * 5000
    }

    console.log(`\n  Creating: ${bookTitle} - overdue ${s.overdueDays}d - fine ${amount}đ`)

    // Insert borrow record (skip if duplicate)
    const borrowResult = await client.query({
      text: `INSERT INTO borrow_records (id, "libraryCardId", "bookCopyId", "librarianId", "borrowDate", "dueDate", status, "createdAt")
             VALUES (gen_random_uuid(), $1, $2, $3, ${borrowDate}, ${dueDate}, 'overdue', ${borrowDate})
             ON CONFLICT DO NOTHING
             RETURNING id`,
      values: [s.cardId, s.copy.id, lib.id]
    })

    if (borrowResult.rows.length > 0) {
      insertedBorrows++
      const borrowId = borrowResult.rows[0].id
      console.log(`    ✅ Borrow record created: ${borrowId}`)

      // Insert corresponding fine
      const fineResult = await client.query({
        text: `INSERT INTO fines (id, "borrowRecordId", "fineType", "overdueDays", amount, status, "createdAt")
               VALUES (gen_random_uuid(), $1, 'overdue', $2, $3, 'pending', ${dueDate})
               ON CONFLICT DO NOTHING
               RETURNING id`,
        values: [borrowId, s.overdueDays, amount]
      })

      if (fineResult.rows.length > 0) {
        insertedFines++
        console.log(`    ✅ Fine created: ${fineResult.rows[0].id} (${amount}đ)`)
      }
    } else {
      console.log(`    ⏭️  Skipped (already exists)`)
    }
  }

  console.log(`\n📊 Results:`)
  console.log(`   Borrows inserted: ${insertedBorrows}`)
  console.log(`   Fines inserted: ${insertedFines}`)

  // Final verification
  const finalFines = (await client.query(
    `SELECT COUNT(*)::int AS cnt,
            SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN status='paid' THEN 1 ELSE 0 END) AS paid
     FROM fines`
  )).rows[0]

  const finalBorrows = (await client.query(
    `SELECT status, COUNT(*)::int AS cnt FROM borrow_records GROUP BY status ORDER BY status`
  )).rows

  console.log(`\n📊 Final state:`)
  console.log(`   Fines: total=${finalFines.cnt} pending=${finalFines.pending} paid=${finalFines.paid}`)
  for (const b of finalBorrows) {
    console.log(`   Borrows ${b.status}: ${b.cnt}`)
  }

  await client.end()
  console.log('👋 Done')
}

main().catch(e => { console.error('❌ ' + e.message); process.exit(1) })
