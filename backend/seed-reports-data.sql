-- =============================================================
-- Seed Data for Reports Testing
-- =============================================================
-- This script adds data to exercise all report features

-- =============================================================
-- 0. FIX reader2 missing role
-- =============================================================
UPDATE users SET "roleId" = 3 WHERE username = 'reader2' AND "roleId" IS NULL;

-- =============================================================
-- 1. READER 3 — Create a third reader for more diverse data
-- =============================================================
INSERT INTO users (id, username, email, "passwordHash", "isActive", "roleId", "createdAt")
SELECT 'a0000000-0000-4000-8000-000000000005', 'reader3', 'reader3@example.com', u."passwordHash", true, 3, '2024-03-01T00:00:00Z'
FROM users u WHERE u.id = 'a0000000-0000-4000-8000-000000000003'
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles ("userId", "fullName", phone, address)
SELECT 'a0000000-0000-4000-8000-000000000005', 'Phạm Văn An', '0934567890', '789 Điện Biên Phủ, Q.Bình Thạnh, TP.HCM'
WHERE NOT EXISTS (SELECT 1 FROM user_profiles WHERE "userId" = 'a0000000-0000-4000-8000-000000000005');

-- Reader 3 card — expired (for expiring cards report)
INSERT INTO library_cards (id, "userId", "issuedById", "cardNumber", "issuedDate", "expiryDate", status)
SELECT 'b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000005',
       'a0000000-0000-4000-8000-000000000002', 'TV-2024-003', '2024-03-01', '2025-03-01', 'expired'
WHERE NOT EXISTS (SELECT 1 FROM library_cards WHERE id = 'b0000000-0000-4000-8000-000000000002');

-- Also reader2 needs a card
INSERT INTO library_cards (id, "userId", "issuedById", "cardNumber", "issuedDate", "expiryDate", status)
SELECT 'b0000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000004',
       'a0000000-0000-4000-8000-000000000002', 'TV-2024-002', '2024-02-01', '2026-12-31', 'active'
WHERE NOT EXISTS (SELECT 1 FROM library_cards WHERE "userId" = 'a0000000-0000-4000-8000-000000000004')
ON CONFLICT DO NOTHING;

-- =============================================================
-- 2. CREATE OVERDUE BORROW RECORDS
--    (For violations "Đang quá hạn" tab)
-- =============================================================

-- Helper: get a random available copy for a book
-- Reader1 overdue — Nhà Giả Kim (book2), due 5 days ago
INSERT INTO borrow_records (id, "libraryCardId", "bookCopyId", "librarianId", "borrowDate", "dueDate", status, "createdAt")
SELECT 'd0000000-0000-4000-8000-000000000004',
       'b0000000-0000-4000-8000-000000000001',
       (SELECT id FROM book_copies WHERE "bookId" = 'c0000000-0000-4000-8000-000000000002' AND status = 'available' LIMIT 1),
       'a0000000-0000-4000-8000-000000000002',
       CURRENT_DATE - 25, CURRENT_DATE - 5, 'overdue', CURRENT_DATE - 25
WHERE NOT EXISTS (SELECT 1 FROM borrow_records WHERE id = 'd0000000-0000-4000-8000-000000000004');

-- Reader1 overdue — Đắc Nhân Tâm (book1), due 3 days ago
INSERT INTO borrow_records (id, "libraryCardId", "bookCopyId", "librarianId", "borrowDate", "dueDate", status, "createdAt")
SELECT 'd0000000-0000-4000-8000-000000000005',
       'b0000000-0000-4000-8000-000000000001',
       (SELECT id FROM book_copies WHERE "bookId" = 'c0000000-0000-4000-8000-000000000001' AND status = 'available' LIMIT 1),
       'a0000000-0000-4000-8000-000000000002',
       CURRENT_DATE - 20, CURRENT_DATE - 3, 'overdue', CURRENT_DATE - 20
WHERE NOT EXISTS (SELECT 1 FROM borrow_records WHERE id = 'd0000000-0000-4000-8000-000000000005');

-- Reader1 overdue — Sapiens (book4), due 7 days ago
INSERT INTO borrow_records (id, "libraryCardId", "bookCopyId", "librarianId", "borrowDate", "dueDate", status, "createdAt")
SELECT 'd0000000-0000-4000-8000-000000000006',
       'b0000000-0000-4000-8000-000000000001',
       (SELECT id FROM book_copies WHERE "bookId" = 'c0000000-0000-4000-8000-000000000004' AND status = 'available' LIMIT 1),
       'a0000000-0000-4000-8000-000000000002',
       CURRENT_DATE - 30, CURRENT_DATE - 7, 'overdue', CURRENT_DATE - 30
WHERE NOT EXISTS (SELECT 1 FROM borrow_records WHERE id = 'd0000000-0000-4000-8000-000000000006');

-- Reader2 overdue — Atomic Habits (book6), due 12 days ago
INSERT INTO borrow_records (id, "libraryCardId", "bookCopyId", "librarianId", "borrowDate", "dueDate", status, "createdAt")
SELECT 'd0000000-0000-4000-8000-000000000007',
       'b0000000-0000-4000-8000-000000000010',
       (SELECT id FROM book_copies WHERE "bookId" = 'c0000000-0000-4000-8000-000000000006' AND status = 'available' LIMIT 1),
       'a0000000-0000-4000-8000-000000000002',
       CURRENT_DATE - 35, CURRENT_DATE - 12, 'overdue', CURRENT_DATE - 35
WHERE NOT EXISTS (SELECT 1 FROM borrow_records WHERE id = 'd0000000-0000-4000-8000-000000000007');

-- Reader2 overdue — Tuổi Trẻ (book17), due 2 days ago
INSERT INTO borrow_records (id, "libraryCardId", "bookCopyId", "librarianId", "borrowDate", "dueDate", status, "createdAt")
SELECT 'd0000000-0000-4000-8000-000000000008',
       'b0000000-0000-4000-8000-000000000010',
       (SELECT id FROM book_copies WHERE "bookId" = 'c0000000-0000-4000-8000-000000000017' AND status = 'available' LIMIT 1),
       'a0000000-0000-4000-8000-000000000002',
       CURRENT_DATE - 15, CURRENT_DATE - 2, 'overdue', CURRENT_DATE - 15
WHERE NOT EXISTS (SELECT 1 FROM borrow_records WHERE id = 'd0000000-0000-4000-8000-000000000008');

-- =============================================================
-- 3. ADD RETURNED BORROW HISTORY (for "Top borrowed" report)
-- =============================================================

-- Nhà Giả Kim (book2) — 3 more returned borrows
INSERT INTO borrow_records (id, "libraryCardId", "bookCopyId", "librarianId", "borrowDate", "dueDate", "returnDate", status, "createdAt")
SELECT gen_random_uuid()::text::uuid,
       'b0000000-0000-4000-8000-000000000001',
       id,
       'a0000000-0000-4000-8000-000000000002',
       CURRENT_DATE - (45 + (row_number() OVER ())*10),
       CURRENT_DATE - (20 + (row_number() OVER ())*5),
       CURRENT_DATE - (15 + (row_number() OVER ())*5),
       'returned',
       CURRENT_DATE - (45 + (row_number() OVER ())*10)
FROM (SELECT id FROM book_copies WHERE "bookId" = 'c0000000-0000-4000-8000-000000000002' AND status = 'available' LIMIT 3) copies;

-- Đắc Nhân Tâm (book1) — 3 more returned borrows
INSERT INTO borrow_records (id, "libraryCardId", "bookCopyId", "librarianId", "borrowDate", "dueDate", "returnDate", status, "createdAt")
SELECT gen_random_uuid()::text::uuid,
       'b0000000-0000-4000-8000-000000000001',
       id,
       'a0000000-0000-4000-8000-000000000002',
       CURRENT_DATE - (70 + (row_number() OVER ())*15),
       CURRENT_DATE - (35 + (row_number() OVER ())*8),
       CURRENT_DATE - (30 + (row_number() OVER ())*8),
       'returned',
       CURRENT_DATE - (70 + (row_number() OVER ())*15)
FROM (SELECT id FROM book_copies WHERE "bookId" = 'c0000000-0000-4000-8000-000000000001' AND status = 'available' LIMIT 3) copies;

-- Atomic Habits (book6) — 2 more returned borrows
INSERT INTO borrow_records (id, "libraryCardId", "bookCopyId", "librarianId", "borrowDate", "dueDate", "returnDate", status, "createdAt")
SELECT gen_random_uuid()::text::uuid,
       'b0000000-0000-4000-8000-000000000001',
       id,
       'a0000000-0000-4000-8000-000000000002',
       CURRENT_DATE - (55 + (row_number() OVER ())*10),
       CURRENT_DATE - (25 + (row_number() OVER ())*5),
       CURRENT_DATE - (20 + (row_number() OVER ())*5),
       'returned',
       CURRENT_DATE - (55 + (row_number() OVER ())*10)
FROM (SELECT id FROM book_copies WHERE "bookId" = 'c0000000-0000-4000-8000-000000000006' AND status = 'available' LIMIT 2) copies;

-- 1984 (book9) — 2 more returned borrows
INSERT INTO borrow_records (id, "libraryCardId", "bookCopyId", "librarianId", "borrowDate", "dueDate", "returnDate", status, "createdAt")
SELECT gen_random_uuid()::text::uuid,
       'b0000000-0000-4000-8000-000000000001',
       id,
       'a0000000-0000-4000-8000-000000000002',
       CURRENT_DATE - (80 + (row_number() OVER ())*10),
       CURRENT_DATE - (50 + (row_number() OVER ())*5),
       CURRENT_DATE - (45 + (row_number() OVER ())*5),
       'returned',
       CURRENT_DATE - (80 + (row_number() OVER ())*10)
FROM (SELECT id FROM book_copies WHERE "bookId" = 'c0000000-0000-4000-8000-000000000009' AND status = 'available' LIMIT 2) copies;

-- Harry Potter (book11) — 3 more returned borrows
INSERT INTO borrow_records (id, "libraryCardId", "bookCopyId", "librarianId", "borrowDate", "dueDate", "returnDate", status, "createdAt")
SELECT gen_random_uuid()::text::uuid,
       'b0000000-0000-4000-8000-000000000001',
       id,
       'a0000000-0000-4000-8000-000000000002',
       CURRENT_DATE - (50 + (row_number() OVER ())*8),
       CURRENT_DATE - (20 + (row_number() OVER ())*5),
       CURRENT_DATE - (15 + (row_number() OVER ())*5),
       'returned',
       CURRENT_DATE - (50 + (row_number() OVER ())*8)
FROM (SELECT id FROM book_copies WHERE "bookId" = 'c0000000-0000-4000-8000-000000000011' AND status = 'available' LIMIT 3) copies;

-- Cha Giàu Cha Nghèo (book12) — 2 more returned borrows
INSERT INTO borrow_records (id, "libraryCardId", "bookCopyId", "librarianId", "borrowDate", "dueDate", "returnDate", status, "createdAt")
SELECT gen_random_uuid()::text::uuid,
       'b0000000-0000-4000-8000-000000000001',
       id,
       'a0000000-0000-4000-8000-000000000002',
       CURRENT_DATE - (65 + (row_number() OVER ())*10),
       CURRENT_DATE - (30 + (row_number() OVER ())*5),
       CURRENT_DATE - (25 + (row_number() OVER ())*5),
       'returned',
       CURRENT_DATE - (65 + (row_number() OVER ())*10)
FROM (SELECT id FROM book_copies WHERE "bookId" = 'c0000000-0000-4000-8000-000000000012' AND status = 'available' LIMIT 2) copies;

-- Sapiens (book4) — 2 more returned borrows
INSERT INTO borrow_records (id, "libraryCardId", "bookCopyId", "librarianId", "borrowDate", "dueDate", "returnDate", status, "createdAt")
SELECT gen_random_uuid()::text::uuid,
       'b0000000-0000-4000-8000-000000000001',
       id,
       'a0000000-0000-4000-8000-000000000002',
       CURRENT_DATE - (60 + (row_number() OVER ())*12),
       CURRENT_DATE - (30 + (row_number() OVER ())*6),
       CURRENT_DATE - (25 + (row_number() OVER ())*6),
       'returned',
       CURRENT_DATE - (60 + (row_number() OVER ())*12)
FROM (SELECT id FROM book_copies WHERE "bookId" = 'c0000000-0000-4000-8000-000000000004' AND status = 'available' LIMIT 2) copies;

-- =============================================================
-- 4. CREATE PENDING FINES (for violations "Còn nợ phí")
-- =============================================================
INSERT INTO fines (id, "borrowRecordId", "fineType", "overdueDays", amount, status, "createdAt")
SELECT gen_random_uuid()::text::uuid, 'd0000000-0000-4000-8000-000000000004', 'overdue', 5, 8000, 'pending', CURRENT_DATE - 5
WHERE NOT EXISTS (SELECT 1 FROM fines WHERE "borrowRecordId" = 'd0000000-0000-4000-8000-000000000004');

INSERT INTO fines (id, "borrowRecordId", "fineType", "overdueDays", amount, status, "createdAt")
SELECT gen_random_uuid()::text::uuid, 'd0000000-0000-4000-8000-000000000005', 'overdue', 3, 5000, 'pending', CURRENT_DATE - 3
WHERE NOT EXISTS (SELECT 1 FROM fines WHERE "borrowRecordId" = 'd0000000-0000-4000-8000-000000000005');

INSERT INTO fines (id, "borrowRecordId", "fineType", "overdueDays", amount, status, "createdAt")
SELECT gen_random_uuid()::text::uuid, 'd0000000-0000-4000-8000-000000000007', 'overdue', 12, 26000, 'pending', CURRENT_DATE - 12
WHERE NOT EXISTS (SELECT 1 FROM fines WHERE "borrowRecordId" = 'd0000000-0000-4000-8000-000000000007');

-- =============================================================
-- 5. CREATE WAITING RESERVATIONS (for replenishment report)
-- =============================================================

-- Nhà Giả Kim (book2) — 3 waiting
INSERT INTO reservations (id, "libraryCardId", "bookId", "queuePosition", status, "reservedAt")
SELECT x.id, x."libraryCardId", x."bookId", x.pos, 'waiting', x.ts
FROM (VALUES
    ('a0000000-0000-0000-0000-000000000101'::uuid, 'b0000000-0000-4000-8000-000000000001'::uuid, 'c0000000-0000-4000-8000-000000000002'::uuid, 1, CURRENT_DATE - 5),
    ('a0000000-0000-0000-0000-000000000102'::uuid, 'b0000000-0000-4000-8000-000000000010'::uuid, 'c0000000-0000-4000-8000-000000000002'::uuid, 2, CURRENT_DATE - 3),
    ('a0000000-0000-0000-0000-000000000103'::uuid, 'b0000000-0000-4000-8000-000000000001'::uuid, 'c0000000-0000-4000-8000-000000000002'::uuid, 3, CURRENT_DATE - 1)
) AS x(id, "libraryCardId", "bookId", pos, ts)
ON CONFLICT (id) DO NOTHING;

-- Atomic Habits (book6) — 2 waiting
INSERT INTO reservations (id, "libraryCardId", "bookId", "queuePosition", status, "reservedAt")
SELECT x.id, x."libraryCardId", x."bookId", x.pos, 'waiting', x.ts
FROM (VALUES
    ('a0000000-0000-0000-0000-000000000104'::uuid, 'b0000000-0000-4000-8000-000000000010'::uuid, 'c0000000-0000-4000-8000-000000000006'::uuid, 1, CURRENT_DATE - 4),
    ('a0000000-0000-0000-0000-000000000105'::uuid, 'b0000000-0000-4000-8000-000000000001'::uuid, 'c0000000-0000-4000-8000-000000000006'::uuid, 2, CURRENT_DATE - 2)
) AS x(id, "libraryCardId", "bookId", pos, ts)
ON CONFLICT (id) DO NOTHING;

-- Homo Deus (book8) — 1 waiting
INSERT INTO reservations (id, "libraryCardId", "bookId", "queuePosition", status, "reservedAt")
VALUES ('a0000000-0000-0000-0000-000000000106', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000008', 1, 'waiting', CURRENT_DATE - 6)
ON CONFLICT (id) DO NOTHING;

-- Lược Sử Thời Gian (book20) — 1 waiting
INSERT INTO reservations (id, "libraryCardId", "bookId", "queuePosition", status, "reservedAt")
VALUES ('a0000000-0000-0000-0000-000000000107', 'b0000000-0000-4000-8000-000000000010', 'c0000000-0000-4000-8000-000000000020', 1, 'waiting', CURRENT_DATE - 7)
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- 6. MARK SOME COPIES FOR DISPOSAL REPORT
-- =============================================================
UPDATE book_copies SET status = 'lost', condition = 'damaged'
WHERE "bookId" = 'c0000000-0000-4000-8000-000000000007'
  AND status = 'available'
  AND id = (SELECT id FROM book_copies WHERE "bookId" = 'c0000000-0000-4000-8000-000000000007' AND status = 'available' LIMIT 1);

UPDATE book_copies SET status = 'disposed', condition = 'damaged'
WHERE "bookId" = 'c0000000-0000-4000-8000-000000000018'
  AND status = 'available'
  AND id = (SELECT id FROM book_copies WHERE "bookId" = 'c0000000-0000-4000-8000-000000000018' AND status = 'available' LIMIT 1);

UPDATE book_copies SET condition = 'damaged'
WHERE "bookId" = 'c0000000-0000-4000-8000-000000000005'
  AND status = 'available'
  AND condition = 'new'
  AND id = (SELECT id FROM book_copies WHERE "bookId" = 'c0000000-0000-4000-8000-000000000005' AND status = 'available' AND condition = 'new' LIMIT 1);

-- =============================================================
-- 7. UPDATE BOOK COUNTS
-- =============================================================
UPDATE books b SET
    "totalCopies" = (SELECT COUNT(*) FROM book_copies bc WHERE bc."bookId" = b.id AND bc.status IN ('available', 'borrowed')),
    "availableCopies" = (SELECT COUNT(*) FROM book_copies bc WHERE bc."bookId" = b.id AND bc.status = 'available')
WHERE b.id IN (
    'c0000000-0000-4000-8000-000000000007',
    'c0000000-0000-4000-8000-000000000018',
    'c0000000-0000-4000-8000-000000000005'
);

-- =============================================================
-- VERIFICATION
-- =============================================================
SELECT '=== DATA ADDED SUCCESSFULLY ===' AS status;

SELECT 'Overdue borrows:' AS info, COUNT(*)::text AS count FROM borrow_records WHERE status = 'overdue'
UNION ALL
SELECT 'Waiting reservations:', COUNT(*)::text FROM reservations WHERE status = 'waiting'
UNION ALL
SELECT 'Pending fines:', COUNT(*)::text FROM fines WHERE status = 'pending'
UNION ALL
SELECT 'Lost/disposed copies:', COUNT(*)::text FROM book_copies WHERE status IN ('lost', 'disposed')
UNION ALL
SELECT 'Damaged copies:', COUNT(*)::text FROM book_copies WHERE condition = 'damaged'
UNION ALL
SELECT 'Total borrows:', COUNT(*)::text FROM borrow_records
UNION ALL
SELECT 'Expired cards:', COUNT(*)::text FROM library_cards WHERE status = 'expired';
