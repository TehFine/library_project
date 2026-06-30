const { DataSource } = require('typeorm');
const db = new DataSource({
    type: 'postgres',
    host: 'aws-1-ap-southeast-1.pooler.supabase.com',
    port: 5432,
    username: 'postgres.zrocsphfcfkwwopgmlxk',
    password: '27DKTbookly',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
});

db.initialize().then(async () => {
    const books = await db.query(`SELECT id, title, "availableCopies" FROM books WHERE title LIKE '%Nhanh%'`);
    console.log(books);
    const bookId = books[0].id;
    const copies = await db.query(`SELECT id, "copyCode", status FROM book_copies WHERE "bookId" = $1`, [bookId]);
    console.log(copies);
    process.exit(0);
});
