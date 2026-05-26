-- =============================================================
-- ADD MORE OVERDUE BORROW RECORDS
-- =============================================================

-- First check current state
SELECT 'Current overdue count:' AS info, COUNT(*)::text AS val FROM borrow_records WHERE status = 'overdue'
UNION ALL
SELECT 'Current borrowing count:', COUNT(*)::text FROM borrow_records WHERE status = 'borrowing'
UNION ALL
SELECT 'Current returned count:', COUNT(*)::text FROM borrow_records WHERE status = 'returned';

-- =============================================================
-- 1. More overdue records for READER 1 (card: TV-2024-001)
--    Card ID: b0000000-0000-4000-8000-000000000001
-- =============================================================

-- Reader1: Harry Potter - overdue 10 days
INSERT INTO borrow_records (id, "libraryCardId", "bookCopyId", "librarianId", "borrowDate", "dueDate", status, "createdAt")
SELECT 'd0000000-0000-4000-8000-000000000010',
       'b0000000-0000-4000-8000-000000000001',
       (SELECT id FROM book_copies WHERE "bookId" = 'c0000000-0000-4000-8000-000000000011' AND status = 'available' LIMIT 1),
       'a0000000-0000-4000-8000-000000000002',
       CURRENT_DATE - 35, CURRENT_DATE - 10, 'overdue', CURRENT_DATE - 35
WHERE NOT EXISTS (SELECT 1 FROM borrow_records WHERE id = 'd0000000-0000-4000-8000-000000000010')
  AND EXISTS (SELECT 1 FROM book_copies WHERE "bookId" = 'c0000000-0000-4000-8000-000000000011' AND status = 'available');

-- Reader1: 1984 - overdue 8 days
INSERT INTO borrow_records (id, "libraryCardId", "bookCopyId", "librarianId", "borrowDate", "dueDate", status, "createdAt")
SELECT 'd0000000-0000-4000-8000-000000000011',
       'b0000000-0000-4000-8000-000000000001',
       (SELECT id FROM book_copies WHERE "bookId" = 'c0000000-0000-4000-8000-000000000009' AND status = 'available' LIMIT 1),
       'a0000000-0000-4000-8000-000000000002',
       CURRENT_DATE - 30, CURRENT_DATE - 8, 'overdue', CURRENT_DATE - 30
WHERE NOT EXISTS (SELECT 1 FROM borrow_records WHERE id = 'd0000000-0000-4000-8000-000000000011')
  AND EXISTS (SELECT 1 FROM book_copies WHERE "bookId" = 'c0000000-0000-4000-8000-000000000009' AND status = 'available');

-- Reader1: Cha Giàu Cha Nghèo - overdue 14 days
INSERT INTO borrow_records (id, "libraryCardId", "bookCopyId", "librarianId", "borrowDate", "dueDate", status, "createdAt")
SELECT 'd0000000-0000-4000-8000-000000000012',
       'b0000000-0000-4000-8000-000000000001',
       (SELECT id FROM book_copies WHERE "bookId" = 'c0000000-0000-4000-8000-000000000012' AND status = 'available' LIMIT 1),
       'a0000000-0000-4000-8000-000000000002',
       CURRENT_DATE - 40, CURRENT_DATE - 14, 'overdue', CURRENT_DATE - 40
WHERE NOT EXISTS (SELECT 1 FROM borrow_records WHERE id = 'd0000000-0000-4000-8000-000000000012')
  AND EXISTS (SELECT 1 FROM book_copies WHERE "bookId" = 'c0000000-0000-4000-8000-000000000012' AND status = 'available');

-- Reader1: Ikigai - overdue 6 days
INSERT INTO borrow_records (id, "libraryCardId", "bookCopyId", "librarianId", "borrowDate", "dueDate", status, "createdAt")
SELECT 'd0000000-0000-4000-8000-000000000013',
       'b0000000-0000-4000-8000-000000000001',
       (SELECT id FROM book_copies WHERE "bookId" = 'c0000000-0000-4000-8000-000000000013' AND status = 'available' LIMIT 1),
       'a0000000-0000-4000-8000-000000000002',
       CURRENT_DATE - 25, CURRENT_DATE - 6, 'overdue', CURRENT_DATE - 25
WHERE NOT EXISTS (SELECT 1 FROM borrow_records WHERE id = 'd0000000-0000-4000-8000-000000000013')
  AND EXISTS (SELECT 1 FROM book_copies WHERE "bookId" = 'c0000000-0000-4000-8000-000000000013' AND status = 'available');

-- =============================================================
-- 2. More overdue records for READER 2 (card: TV-2024-002)
--    Card ID: b0000000-0000-4000-8000-000000000010
-- =============================================================

-- Reader2: 7 Thói Quen - overdue 15 days
INSERT INTO borrow_records (id, "libraryCardId", "bookCopyId", "librarianId", "borrowDate", "dueDate", status, "createdAt")
SELECT 'd0000000-0000-4000-8000-000000000014',
       'b0000000-0000-4000-8000-000000000010',
       (SELECT id FROM book_copies WHERE "bookId" = 'c0000000-0000-4000-8000-000000000015' AND status = 'available' LIMIT 1),
       'a0000000-0000-4000-8000-000000000002',
       CURRENT_DATE - 45, CURRENT_DATE - 15, 'overdue', CURRENT_DATE - 45
WHERE NOT EXISTS (SELECT 1 FROM borrow_records WHERE id = 'd0000000-0000-4000-8000-000000000014')
  AND EXISTS (SELECT 1 FROM book_copies WHERE "bookId" = 'c0000000-0000-4000-8000-000000000015' AND status = 'available');

-- Reader2: Đất Rừng Phương Nam - overdue 5 days
INSERT INTO borrow_records (id, "libraryCardId", "bookCopyId", "librarianId", "borrowDate", "dueDate", status, "createdAt")
SELECT 'd0000000-0000-4000-8000-000000000015',
       'b0000000-0000-4000-8000-000000000010',
       (SELECT id FROM book_copies WHERE "bookId" = 'c0000000-0000-4000-8000-000000000024' AND status = 'available' LIMIT 1),
       'a0000000-0000-4000-8000-000000000002',
       CURRENT_DATE - 20, CURRENT_DATE - 5, 'overdue', CURRENT_DATE - 20
WHERE NOT EXISTS (SELECT 1 FROM borrow_records WHERE id = 'd0000000-0000-4000-8000-000000000015')
  AND EXISTS (SELECT 1 FROM book_copies WHERE "bookId" = 'c0000000-0000-4000-8000-000000000024' AND status = 'available');

-- Reader2: Cà Phê Cùng Tony - overdue 3 days
INSERT INTO borrow_records (id, "libraryCardId", "bookCopyId", "librarianId", "borrowDate", "dueDate", status, "createdAt")
SELECT 'd0000000-0000-4000-8000-000000000016',
       'b0000000-0000-4000-8000-000000000010',
       (SELECT id FROM book_copies WHERE "bookId" = 'c0000000-0000-4000-8000-000000000027' AND status = 'available' LIMIT 1),
       'a0000000-0000-4000-8000-000000000002',
       CURRENT_DATE - 15, CURRENT_DATE - 3, 'overdue', CURRENT_DATE - 15
WHERE NOT EXISTS (SELECT 1 FROM borrow_records WHERE id = 'd0000000-0000-4000-8000-000000000016')
  AND EXISTS (SELECT 1 FROM book_copies WHERE "bookId" = 'c0000000-0000-4000-8000-000000000027' AND status = 'available');

-- =============================================================
-- 3. ADD CORRESPONDING PENDING FINES
-- =============================================================

-- Fine for Harry Potter overdue (10 days)
INSERT INTO fines (id, "borrowRecordId", "fineType", "overdueDays", amount, status, "createdAt")
SELECT gen_random_uuid()::text::uuid, 'd0000000-0000-4000-8000-000000000010', 'overdue', 10, 20000, 'pending', CURRENT_DATE - 10
WHERE EXISTS (SELECT 1 FROM borrow_records WHERE id = 'd0000000-0000-4000-8000-000000000010' AND status = 'overdue')
  AND NOT EXISTS (SELECT 1 FROM fines WHERE "borrowRecordId" = 'd0000000-0000-4000-8000-000000000010');

-- Fine for 1984 overdue (8 days)
INSERT INTO fines (id, "borrowRecordId", "fineType", "overdueDays", amount, status, "createdAt")
SELECT gen_random_uuid()::text::uuid, 'd0000000-0000-4000-8000-000000000011', 'overdue', 8, 14000, 'pending', CURRENT_DATE - 8
WHERE EXISTS (SELECT 1 FROM borrow_records WHERE id = 'd0000000-0000-4000-8000-000000000011' AND status = 'overdue')
  AND NOT EXISTS (SELECT 1 FROM fines WHERE "borrowRecordId" = 'd0000000-0000-4000-8000-000000000011');

-- Fine for Cha Giàu Cha Nghèo overdue (14 days)
INSERT INTO fines (id, "borrowRecordId", "fineType", "overdueDays", amount, status, "createdAt")
SELECT gen_random_uuid()::text::uuid, 'd0000000-0000-4000-8000-000000000012', 'overdue', 14, 32000, 'pending', CURRENT_DATE - 14
WHERE EXISTS (SELECT 1 FROM borrow_records WHERE id = 'd0000000-0000-4000-8000-000000000012' AND status = 'overdue')
  AND NOT EXISTS (SELECT 1 FROM fines WHERE "borrowRecordId" = 'd0000000-0000-4000-8000-000000000012');

-- Fine for Ikigai overdue (6 days)
INSERT INTO fines (id, "borrowRecordId", "fineType", "overdueDays", amount, status, "createdAt")
SELECT gen_random_uuid()::text::uuid, 'd0000000-0000-4000-8000-000000000013', 'overdue', 6, 11000, 'pending', CURRENT_DATE - 6
WHERE EXISTS (SELECT 1 FROM borrow_records WHERE id = 'd0000000-0000-4000-8000-000000000013' AND status = 'overdue')
  AND NOT EXISTS (SELECT 1 FROM fines WHERE "borrowRecordId" = 'd0000000-0000-4000-8000-000000000013');

-- Fine for 7 Thói Quen overdue (15 days)
INSERT INTO fines (id, "borrowRecordId", "fineType", "overdueDays", amount, status, "createdAt")
SELECT gen_random_uuid()::text::uuid, 'd0000000-0000-4000-8000-000000000014', 'overdue', 15, 35000, 'pending', CURRENT_DATE - 15
WHERE EXISTS (SELECT 1 FROM borrow_records WHERE id = 'd0000000-0000-4000-8000-000000000014' AND status = 'overdue')
  AND NOT EXISTS (SELECT 1 FROM fines WHERE "borrowRecordId" = 'd0000000-0000-4000-8000-000000000014');

-- Fine for Đất Rừng Phương Nam overdue (5 days)
INSERT INTO fines (id, "borrowRecordId", "fineType", "overdueDays", amount, status, "createdAt")
SELECT gen_random_uuid()::text::uuid, 'd0000000-0000-4000-8000-000000000015', 'overdue', 5, 8000, 'pending', CURRENT_DATE - 5
WHERE EXISTS (SELECT 1 FROM borrow_records WHERE id = 'd0000000-0000-4000-8000-000000000015' AND status = 'overdue')
  AND NOT EXISTS (SELECT 1 FROM fines WHERE "borrowRecordId" = 'd0000000-0000-4000-8000-000000000015');

-- Fine for Cà Phê Cùng Tony overdue (3 days)
INSERT INTO fines (id, "borrowRecordId", "fineType", "overdueDays", amount, status, "createdAt")
SELECT gen_random_uuid()::text::uuid, 'd0000000-0000-4000-8000-000000000016', 'overdue', 3, 5000, 'pending', CURRENT_DATE - 3
WHERE EXISTS (SELECT 1 FROM borrow_records WHERE id = 'd0000000-0000-4000-8000-000000000016' AND status = 'overdue')
  AND NOT EXISTS (SELECT 1 FROM fines WHERE "borrowRecordId" = 'd0000000-0000-4000-8000-000000000016');

-- =============================================================
-- VERIFICATION
-- =============================================================
SELECT '=== AFTER SEED ===' AS info;

SELECT 'Overdue:' AS metric, COUNT(*)::text AS count FROM borrow_records WHERE status = 'overdue'
UNION ALL
SELECT 'Borrowing:', COUNT(*)::text FROM borrow_records WHERE status = 'borrowing'
UNION ALL
SELECT 'Returned:', COUNT(*)::text FROM borrow_records WHERE status = 'returned'
UNION ALL
SELECT 'Total borrows:', COUNT(*)::text FROM borrow_records
UNION ALL
SELECT 'Pending fines:', COUNT(*)::text FROM fines WHERE status = 'pending'
UNION ALL
SELECT 'Paid fines:', COUNT(*)::text FROM fines WHERE status = 'paid';

-- Show overdue with reader info
SELECT br.id, br.status, br."borrowDate", br."dueDate", 
       (CURRENT_DATE - br."dueDate")::text AS overdue_days,
       lc."cardNumber", up."fullName"
FROM borrow_records br 
JOIN library_cards lc ON br."libraryCardId" = lc.id 
JOIN user_profiles up ON lc."userId" = up."userId" 
WHERE br.status = 'overdue' 
ORDER BY br."dueDate";
