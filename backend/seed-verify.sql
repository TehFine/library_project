SELECT '=== VERIFICATION REPORT ===' AS info;

SELECT 'Overdue borrows:' AS metric, COUNT(*)::text AS value FROM borrow_records WHERE status = 'overdue'
UNION ALL
SELECT 'Borrowing (active):', COUNT(*)::text FROM borrow_records WHERE status = 'borrowing'
UNION ALL
SELECT 'Returned:', COUNT(*)::text FROM borrow_records WHERE status = 'returned'
UNION ALL
SELECT 'Total borrows:', COUNT(*)::text FROM borrow_records
UNION ALL
SELECT '', '---'
UNION ALL
SELECT 'Pending fines:', COUNT(*)::text FROM fines WHERE status = 'pending'
UNION ALL
SELECT 'Paid fines:', COUNT(*)::text FROM fines WHERE status = 'paid'
UNION ALL
SELECT 'Total fines:', COUNT(*)::text FROM fines
UNION ALL
SELECT '', '---'
UNION ALL
SELECT 'Waiting reservations:', COUNT(*)::text FROM reservations WHERE status = 'waiting'
UNION ALL
SELECT 'Total reservations:', COUNT(*)::text FROM reservations
UNION ALL
SELECT '', '---'
UNION ALL
SELECT 'Lost copies:', COUNT(*)::text FROM book_copies WHERE status = 'lost'
UNION ALL
SELECT 'Disposed copies:', COUNT(*)::text FROM book_copies WHERE status = 'disposed'
UNION ALL
SELECT 'Damaged copies:', COUNT(*)::text FROM book_copies WHERE condition = 'damaged'
UNION ALL
SELECT '', '---'
UNION ALL
SELECT 'Library cards:', COUNT(*)::text FROM library_cards
UNION ALL
SELECT 'Expired cards:', COUNT(*)::text FROM library_cards WHERE status = 'expired'
UNION ALL
SELECT 'Users:', COUNT(*)::text FROM users;
