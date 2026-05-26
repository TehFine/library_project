SELECT br.status, br."borrowDate", br."dueDate", 
       (CURRENT_DATE - br."dueDate")::text AS overdue_days,
       lc."cardNumber", up."fullName"
FROM borrow_records br 
JOIN library_cards lc ON br."libraryCardId" = lc.id 
JOIN user_profiles up ON lc."userId" = up."userId" 
WHERE br.status = 'overdue' 
ORDER BY br."dueDate";
