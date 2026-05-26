-- Add missing fines for overdue records that don't have one yet
INSERT INTO fines (id, "borrowRecordId", "fineType", "overdueDays", amount, status, "createdAt")
SELECT gen_random_uuid()::text::uuid, 'd0000000-0000-4000-8000-000000000006', 'overdue', 7, 14000, 'pending', CURRENT_DATE - 7
WHERE NOT EXISTS (SELECT 1 FROM fines WHERE "borrowRecordId" = 'd0000000-0000-4000-8000-000000000006');

INSERT INTO fines (id, "borrowRecordId", "fineType", "overdueDays", amount, status, "createdAt")
SELECT gen_random_uuid()::text::uuid, 'd0000000-0000-4000-8000-000000000008', 'overdue', 2, 5000, 'pending', CURRENT_DATE - 2
WHERE NOT EXISTS (SELECT 1 FROM fines WHERE "borrowRecordId" = 'd0000000-0000-4000-8000-000000000008');

-- Verify
SELECT COUNT(*) AS pending_fines FROM fines WHERE status = 'pending';
