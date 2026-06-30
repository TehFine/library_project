// Seed overdue borrows + fines for readers
// Safe to re-run: uses ON CONFLICT / WHERE NOT EXISTS checks
// Usage: node seed-overdue-fines-reader.js
// Only INSERTS new data, never modifies existing data

const { Client } = require('pg')
require('dotenv').config()

const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'postgres',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
})

// Fine calculation: 5 days đầu 1,000đ/ngày, từ ngày 6: 3,000đ/ngày
function calcFine(days) {
  if (days <= 0) return 0
  if (days <= 5) return days * 1000
  return 5 * 1000 + (days - 5) * 3000
}

async function main() {
  await client.connect()
  console.log('✅ Connected to database')

  // =====================================================
  // 1. Get reference data
  // =====================================================
  const cards = (await client.query(
    `SELECT lc.id, lc."cardNumber", up."fullName"
     FROM library_cards lc
     JOIN user_profiles up ON lc."userId" = up."userId"
     WHERE lc.status = 'active'
     ORDER BY lc."cardNumber"`
  )).rows
  console.log(`💳 Active cards: ${cards.length}`)
  cards.forEach(c => console.log(`   ${c.cardNumber} — ${c.fullName}`))

  const librarian = (await client.query(
    `SELECT id FROM users
     WHERE "roleId" IN (SELECT id FROM roles WHERE name IN ('librarian','library_admin'))
     LIMIT 1`
  )).rows[0]
  if (!librarian) { console.error('❌ No librarian found'); process.exit(1) }
  console.log(`👤 Librarian: ${librarian.id}`)

  // Get book titles for display
  const books = (await client.query(`SELECT id, title FROM books`)).rows
  const bookMap = new Map(books.map(b => [b.id, b.title]))

  // =====================================================
  // 2. Define seed plan per card
  // =====================================================
  // Each scenario: [cardId, overdueDays, preferredBookTitle (optional)]
  const scenarios = [
    // Trần Văn Minh — thẻ TV-2024-001
    { cardIdx: 0, overdueDays: 12, bookTitle: 'Sapiens: Lược Sử Loài Người' },
    { cardIdx: 0, overdueDays: 7,  bookTitle: 'Rừng Na Uy' },
    { cardIdx: 0, overdueDays: 20, bookTitle: 'Tôi Tài Giỏi, Bạn Cũng Thế' },
    { cardIdx: 0, overdueDays: 4,  bookTitle: 'Atomic Habits' },

    // Đặng Văn Thế — thẻ TV-2026-3810
    { cardIdx: 2, overdueDays: 15, bookTitle: 'Cha Giàu Cha Nghèo' },
    { cardIdx: 2, overdueDays: 9,  bookTitle: 'Tư Duy Nhanh Và Chậm' },
    { cardIdx: 2, overdueDays: 3,  bookTitle: 'Kinh Tế Học Hài Hước' },

    // Dang Van The — thẻ TV-2026-2936
    { cardIdx: 3, overdueDays: 18, bookTitle: '1984' },
    { cardIdx: 3, overdueDays: 6,  bookTitle: 'Đắc Nhân Tâm' },

    // Độc Giả Test Cấp Thẻ — thẻ TV-2026-3171
    { cardIdx: 4, overdueDays: 10, bookTitle: 'Harry Potter và Hòn Đá Phù Thủy' },
    { cardIdx: 4, overdueDays: 5,  bookTitle: 'Clean Code' },
    { cardIdx: 4, overdueDays: 14, bookTitle: 'Ikigai' },
  ]

  let insertedBorrows = 0
  let skippedBorrows = 0
  let insertedFines = 0
  let skippedFines = 0

  for (const s of scenarios) {
    const card = cards[s.cardIdx]
    if (!card) {
      console.log(`⚠️  Card index ${s.cardIdx} not found, skipping`)
      continue
    }

    // Find an available copy of the preferred book
    let copyResult = await client.query({
      text: `SELECT bc.id, bc."bookId" FROM book_copies bc
             JOIN books b ON bc."bookId" = b.id
             WHERE bc.status = 'available' AND b.title = $1
             LIMIT 1`,
      values: [s.bookTitle]
    })

    // If preferred book not available, pick any available copy
    if (copyResult.rows.length === 0) {
      copyResult = await client.query({
        text: `SELECT bc.id, bc."bookId" FROM book_copies bc
               WHERE bc.status = 'available'
               OFFSET floor(random() * (SELECT COUNT(*) FROM book_copies WHERE status = 'available'))::int
               LIMIT 1`,
        values: []
      })
    }
    if (copyResult.rows.length === 0) {
      console.log(`⚠️  No available copies left, stopping`)
      break
    }

    const copy = copyResult.rows[0]
    const bookTitle = bookMap.get(copy.bookId) || 'Unknown'

    const today = new Date()
    const borrowDate = new Date(today)
    borrowDate.setDate(borrowDate.getDate() - (s.overdueDays + 14))
    const dueDate = new Date(today)
    dueDate.setDate(dueDate.getDate() - s.overdueDays)

    const borrowDateStr = borrowDate.toISOString().split('T')[0]
    const dueDateStr = dueDate.toISOString().split('T')[0]
    const amount = calcFine(s.overdueDays)

    console.log(`\n📖 ${card.fullName} (${card.cardNumber}) — "${bookTitle}"`)
    console.log(`   Quá hạn ${s.overdueDays} ngày → phí ${amount.toLocaleString('vi-VN')}đ`)

    // Check if borrow already exists for this card+copy combination
    const existingBorrow = await client.query({
      text: `SELECT id FROM borrow_records WHERE "libraryCardId" = $1 AND "bookCopyId" = $2 AND status = 'overdue' LIMIT 1`,
      values: [card.id, copy.id]
    })

    if (existingBorrow.rows.length > 0) {
      const borrowId = existingBorrow.rows[0].id
      console.log(`   ⏭️  Borrow already exists — reusing existing record`)
      skippedBorrows++

      // Check if fine already exists for this borrow
      const existingFine = await client.query({
        text: `SELECT id FROM fines WHERE "borrowRecordId" = $1 LIMIT 1`,
        values: [borrowId]
      })

      if (existingFine.rows.length > 0) {
        skippedFines++
        console.log(`   ⏭️  Fine already exists — skipping`)
        continue
      }

      // Insert missing fine for existing borrow
      const fineResult = await client.query({
        text: `INSERT INTO fines (id, "borrowRecordId", "fineType", "overdueDays", amount, status, "createdAt")
               SELECT gen_random_uuid(), $1, 'overdue', $2, $3, 'pending', $4::date
               WHERE NOT EXISTS (SELECT 1 FROM fines WHERE "borrowRecordId" = $1)
               RETURNING id`,
        values: [borrowId, s.overdueDays, amount, dueDateStr]
      })

      if (fineResult.rows.length > 0) {
        insertedFines++
        console.log(`   ✅ Missing fine created (${amount.toLocaleString('vi-VN')}đ)`)
      }
      continue
    }

    // Insert borrow record (new)
    const borrowResult = await client.query({
      text: `INSERT INTO borrow_records (id, "libraryCardId", "bookCopyId", "librarianId", "borrowDate", "dueDate", status, "createdAt")
             VALUES (gen_random_uuid(), $1, $2, $3, $4::date, $5::date, 'overdue', $4::date)
             RETURNING id`,
      values: [card.id, copy.id, librarian.id, borrowDateStr, dueDateStr]
    })

    if (borrowResult.rows.length > 0) {
      insertedBorrows++
      const borrowId = borrowResult.rows[0].id

      // Update book copy status to 'borrowed'
      await client.query({
        text: `UPDATE book_copies SET status = 'borrowed' WHERE id = $1 AND status = 'available'`,
        values: [copy.id]
      })

      // Insert corresponding fine (with WHERE NOT EXISTS to prevent duplicates on re-run)
      const fineResult = await client.query({
        text: `INSERT INTO fines (id, "borrowRecordId", "fineType", "overdueDays", amount, status, "createdAt")
               SELECT gen_random_uuid(), $1, 'overdue', $2, $3, 'pending', $4::date
               WHERE NOT EXISTS (SELECT 1 FROM fines WHERE "borrowRecordId" = $1)
               RETURNING id`,
        values: [borrowId, s.overdueDays, amount, dueDateStr]
      })

      if (fineResult.rows.length > 0) {
        insertedFines++
        console.log(`   ✅ Borrow + Fine created (${amount.toLocaleString('vi-VN')}đ)`)
      } else {
        skippedFines++
        console.log(`   ✅ Borrow created, ⏭️ Fine skipped (already exists)`)
      }
    } else {
      skippedBorrows++
      console.log(`   ⏭️  Skipped (borrow already exists)`)
    }
  }

  // =====================================================
  // 3. Summary
  // =====================================================
  console.log(`\n${'='.repeat(50)}`)
  console.log(`📊 KẾT QUẢ:`)
  console.log(`   Borrow records inserted: ${insertedBorrows}`)
  console.log(`   Borrow records skipped:  ${skippedBorrows}`)
  console.log(`   Fines inserted:          ${insertedFines}`)
  console.log(`   Fines skipped:           ${skippedFines}`)

  // Final verification
  const finalBorrowStats = (await client.query(
    `SELECT status, COUNT(*)::int AS cnt FROM borrow_records GROUP BY status ORDER BY status`
  )).rows

  const finalFineStats = (await client.query(
    `SELECT status, COUNT(*)::int AS cnt FROM fines GROUP BY status ORDER BY status`
  )).rows

  console.log(`\n📊 TRẠNG THÁI HIỆN TẠI:`)
  for (const b of finalBorrowStats) {
    console.log(`   Borrows ${b.status}: ${b.cnt}`)
  }
  for (const f of finalFineStats) {
    console.log(`   Fines ${f.status}: ${f.cnt}`)
  }

  // Show overdue records with reader info
  const overdueDetails = (await client.query(
    `SELECT br.id, br."overdueDays", br.amount, br.status,
            lc."cardNumber", up."fullName", b.title
     FROM fines br
     JOIN borrow_records bor ON br."borrowRecordId" = bor.id
     JOIN library_cards lc ON bor."libraryCardId" = lc.id
     JOIN user_profiles up ON lc."userId" = up."userId"
     JOIN book_copies bc ON bor."bookCopyId" = bc.id
     JOIN books b ON bc."bookId" = b.id
     WHERE br.status = 'pending'
     ORDER BY up."fullName", br."overdueDays" DESC`
  )).rows

  console.log(`\n📋 DANH SÁCH PHÍ PHẠT ĐANG CHỜ:`)
  for (const f of overdueDetails) {
    console.log(`   ${f.fullName} (${f.cardNumber}) | ${f.title} | ${f.overdueDays} ngày | ${Number(f.amount).toLocaleString('vi-VN')}đ | ${f.status}`)
  }

  await client.end()
  console.log('\n👋 Done!')
}

main().catch(e => {
  console.error('❌ Error:', e.message)
  process.exit(1)
})
