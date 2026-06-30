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
    const books = await db.query(`SELECT id, title, "totalCopies", "availableCopies" FROM books`);
    for (const book of books) {
        const copies = await db.query(`SELECT status FROM book_copies WHERE "bookId" = $1`, [book.id]);
        const total = copies.length;
        const available = copies.filter(c => c.status === 'available').length;
        if (book.totalCopies !== total || book.availableCopies !== available) {
            console.log(`Fixing Book ${book.title}: total ${book.totalCopies}->${total}, available ${book.availableCopies}->${available}`);
            await db.query(`UPDATE books SET "totalCopies" = $1, "availableCopies" = $2 WHERE id = $3`, [total, available, book.id]);
        }
    }
    console.log("Sync complete!");
    process.exit(0);
});
