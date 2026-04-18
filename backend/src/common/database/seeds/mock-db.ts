import { v4 as uuid } from 'uuid'
import * as bcrypt from 'bcryptjs'

// ── Seeded IDs ────────────────────────────────────────────────────────────────
export const SEED_IDS = {
    // Users
    adminUser: 'user-admin-001',
    librarianUser: 'user-librarian-001',
    readerUser: 'user-reader-001',
    readerUser2: 'user-reader-002',

    // Library cards
    card1: 'card-001',

    // Categories
    catNovel: 1,
    catSkills: 2,
    catHistory: 3,
    catTech: 4,
    catPsych: 5,

    // Books
    book1: 'book-001', book2: 'book-002', book3: 'book-003',
    book4: 'book-004', book5: 'book-005', book6: 'book-006',
    book7: 'book-007', book8: 'book-008',

    // Borrow records
    borrow1: 'borrow-001', borrow2: 'borrow-002', borrow3: 'borrow-003',
}

// ── In-memory store ───────────────────────────────────────────────────────────
export class MockDB {
    users: any[] = []
    libraryCards: any[] = []
    categories: any[] = []
    books: any[] = []
    bookCopies: any[] = []
    borrowRecords: any[] = []
    reservations: any[] = []
    fines: any[] = []

    constructor() { this.seed() }

    private async seed() {
        const hash = await bcrypt.hash('password123', 10)

        // ── Users ─────────────────────────────────────────────────────────────────
        this.users = [
            {
                id: SEED_IDS.adminUser,
                username: 'admin',
                email: 'admin@library.vn',
                passwordHash: hash,
                role: 'library_admin',
                fullName: 'Quản trị viên',
                phone: null, idCardNumber: null, dateOfBirth: null, address: null,
                isActive: true,
                lastLogin: new Date().toISOString(),
                createdAt: '2024-01-01T00:00:00Z',
            },
            {
                id: SEED_IDS.librarianUser,
                username: 'librarian',
                email: 'librarian@library.vn',
                passwordHash: hash,
                role: 'librarian',
                fullName: 'Nguyễn Thị Lan',
                phone: '0901234567', idCardNumber: null, dateOfBirth: null, address: null,
                isActive: true,
                lastLogin: new Date().toISOString(),
                createdAt: '2024-01-02T00:00:00Z',
            },
            {
                id: SEED_IDS.readerUser,
                username: 'reader',
                email: 'reader@example.com',
                passwordHash: hash,
                role: 'reader',
                fullName: 'Trần Văn Minh',
                phone: '0912345678',
                idCardNumber: '012345678901',
                dateOfBirth: '1998-05-15',
                address: '123 Đường Nguyễn Huệ, Q.1, TP.HCM',
                isActive: true,
                lastLogin: new Date().toISOString(),
                createdAt: '2024-01-10T00:00:00Z',
            },
            {
                id: SEED_IDS.readerUser2,
                username: 'reader2',
                email: 'reader2@example.com',
                passwordHash: hash,
                role: 'reader',
                fullName: 'Lê Thị Hoa',
                phone: '0923456789',
                idCardNumber: '098765432100',
                dateOfBirth: '2000-08-20',
                address: '456 Lê Lợi, Q.3, TP.HCM',
                isActive: true,
                lastLogin: null,
                createdAt: '2024-02-01T00:00:00Z',
            },
        ]

        // ── Library Cards ─────────────────────────────────────────────────────────
        this.libraryCards = [
            {
                id: SEED_IDS.card1,
                userId: SEED_IDS.readerUser,
                issuedBy: SEED_IDS.librarianUser,
                cardNumber: 'TV-2024-001',
                issuedDate: '2024-01-10',
                expiryDate: '2025-01-10',
                status: 'active',
            },
        ]

        // ── Categories ────────────────────────────────────────────────────────────
        this.categories = [
            { id: 1, name: 'Tiểu thuyết' },
            { id: 2, name: 'Kỹ năng sống' },
            { id: 3, name: 'Lịch sử' },
            { id: 4, name: 'Công nghệ' },
            { id: 5, name: 'Tâm lý học' },
            { id: 6, name: 'Khoa học' },
        ]

        // ── Books ─────────────────────────────────────────────────────────────────
        this.books = [
            {
                id: SEED_IDS.book1,
                isbn: '978-604-2-18901-3',
                title: 'Đắc Nhân Tâm',
                author: 'Dale Carnegie',
                publisher: 'NXB Tổng hợp TP.HCM',
                categoryId: 2,
                publishYear: 2016,
                description: 'Cuốn sách kinh điển về nghệ thuật giao tiếp và ứng xử với mọi người. Hướng dẫn cách tạo ấn tượng tốt, thuyết phục người khác và xây dựng mối quan hệ bền vững.',
                coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/71WjMhbTLtL.jpg',
                totalCopies: 5, availableCopies: 3,
                createdBy: SEED_IDS.librarianUser,
                createdAt: '2024-01-05T00:00:00Z',
            },
            {
                id: SEED_IDS.book2,
                isbn: '978-604-1-09234-7',
                title: 'Nhà Giả Kim',
                author: 'Paulo Coelho',
                publisher: 'NXB Hội Nhà Văn',
                categoryId: 1,
                publishYear: 2020,
                description: 'Hành trình của Santiago — một cậu bé chăn cừu Tây Ban Nha đến vùng đất Ai Cập để tìm kho báu. Một câu chuyện về ước mơ và số phận.',
                coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/71aFt4+OTOL.jpg',
                totalCopies: 4, availableCopies: 0,
                createdBy: SEED_IDS.librarianUser,
                createdAt: '2024-01-05T00:00:00Z',
            },
            {
                id: SEED_IDS.book3,
                isbn: '978-604-9-72311-2',
                title: 'Tư Duy Nhanh Và Chậm',
                author: 'Daniel Kahneman',
                publisher: 'NXB Thế Giới',
                categoryId: 5,
                publishYear: 2019,
                description: 'Khám phá hai hệ thống tư duy chi phối mọi quyết định của con người: tư duy nhanh (cảm tính) và tư duy chậm (lý trí).',
                coverUrl: null,
                totalCopies: 3, availableCopies: 2,
                createdBy: SEED_IDS.librarianUser,
                createdAt: '2024-01-06T00:00:00Z',
            },
            {
                id: SEED_IDS.book4,
                isbn: '978-604-3-45612-8',
                title: 'Sapiens: Lược Sử Loài Người',
                author: 'Yuval Noah Harari',
                publisher: 'NXB Tri Thức',
                categoryId: 3,
                publishYear: 2018,
                description: 'Hành trình tiến hóa của loài người từ thời tiền sử đến hiện đại, qua các cuộc cách mạng nhận thức, nông nghiệp và khoa học.',
                coverUrl: null,
                totalCopies: 6, availableCopies: 4,
                createdBy: SEED_IDS.librarianUser,
                createdAt: '2024-01-07T00:00:00Z',
            },
            {
                id: SEED_IDS.book5,
                isbn: '978-604-7-88234-1',
                title: 'Clean Code',
                author: 'Robert C. Martin',
                publisher: 'NXB Khoa học kỹ thuật',
                categoryId: 4,
                publishYear: 2021,
                description: 'Hướng dẫn viết code sạch, dễ đọc và dễ bảo trì. Các nguyên tắc và kỹ thuật giúp lập trình viên tạo ra phần mềm chất lượng cao.',
                coverUrl: null,
                totalCopies: 4, availableCopies: 4,
                createdBy: SEED_IDS.librarianUser,
                createdAt: '2024-01-08T00:00:00Z',
            },
            {
                id: SEED_IDS.book6,
                isbn: '978-604-2-33219-5',
                title: 'Atomic Habits',
                author: 'James Clear',
                publisher: 'NXB Lao Động',
                categoryId: 2,
                publishYear: 2022,
                description: 'Xây dựng thói quen tốt và loại bỏ thói quen xấu thông qua những thay đổi nhỏ nhưng đột phá. Phương pháp khoa học được chứng minh hiệu quả.',
                coverUrl: null,
                totalCopies: 5, availableCopies: 2,
                createdBy: SEED_IDS.librarianUser,
                createdAt: '2024-01-09T00:00:00Z',
            },
            {
                id: SEED_IDS.book7,
                isbn: '978-604-5-67890-3',
                title: 'Dune',
                author: 'Frank Herbert',
                publisher: 'NXB Kim Đồng',
                categoryId: 1,
                publishYear: 2023,
                description: 'Sử thi khoa học viễn tưởng vĩ đại nhất mọi thời đại. Câu chuyện về chính trị, tôn giáo và sinh thái trên hành tinh sa mạc Arrakis.',
                coverUrl: null,
                totalCopies: 2, availableCopies: 2,
                createdBy: SEED_IDS.librarianUser,
                createdAt: '2024-01-10T00:00:00Z',
            },
            {
                id: SEED_IDS.book8,
                isbn: '978-604-6-11111-0',
                title: 'Homo Deus',
                author: 'Yuval Noah Harari',
                publisher: 'NXB Tri Thức',
                categoryId: 6,
                publishYear: 2020,
                description: 'Tương lai của loài người: trí tuệ nhân tạo, bất tử và hạnh phúc. Yuval Noah Harari phác thảo lịch sử ngày mai.',
                coverUrl: null,
                totalCopies: 3, availableCopies: 1,
                createdBy: SEED_IDS.librarianUser,
                createdAt: '2024-01-11T00:00:00Z',
            },
        ]

        // ── Book Copies ───────────────────────────────────────────────────────────
        const copies: any[] = []
        this.books.forEach(book => {
            for (let i = 1; i <= book.totalCopies; i++) {
                const available = i <= book.availableCopies
                copies.push({
                    id: uuid(),
                    bookId: book.id,
                    copyCode: `${book.isbn.slice(-4)}-${String(i).padStart(3, '0')}`,
                    condition: i <= 2 ? 'good' : 'new',
                    status: available ? 'available' : 'borrowed',
                    notes: null,
                    createdAt: book.createdAt,
                })
            }
        })
        this.bookCopies = copies

        // ── Borrow Records ────────────────────────────────────────────────────────
        const today = new Date()
        const daysAgo = (n: number) => new Date(today.getTime() - n * 86400000).toISOString().split('T')[0]
        const daysAhead = (n: number) => new Date(today.getTime() + n * 86400000).toISOString().split('T')[0]

        const borrowedCopies = copies.filter(c => c.status === 'borrowed')
        const bookCopyForBook = (bookId: string) => borrowedCopies.find(c => c.bookId === bookId)

        this.borrowRecords = [
            {
                id: SEED_IDS.borrow1,
                libraryCardId: SEED_IDS.card1,
                bookCopyId: bookCopyForBook(SEED_IDS.book1)?.id ?? copies[1].id,
                librarianId: SEED_IDS.librarianUser,
                borrowDate: daysAgo(10),
                dueDate: daysAhead(4),
                returnDate: null,
                status: 'borrowing',
                renewalCount: 0,
                originalDueDate: null,
                renewedAt: null,
                renewedBy: null,
                createdAt: daysAgo(10) + 'T09:00:00Z',
            },
            {
                id: SEED_IDS.borrow2,
                libraryCardId: SEED_IDS.card1,
                bookCopyId: bookCopyForBook(SEED_IDS.book2)?.id ?? copies[5].id,
                librarianId: SEED_IDS.librarianUser,
                borrowDate: daysAgo(20),
                dueDate: daysAgo(6),
                returnDate: null,
                status: 'overdue',
                renewalCount: 0,
                originalDueDate: null,
                renewedAt: null,
                renewedBy: null,
                createdAt: daysAgo(20) + 'T10:00:00Z',
            },
            {
                id: SEED_IDS.borrow3,
                libraryCardId: SEED_IDS.card1,
                bookCopyId: copies.find(c => c.bookId === SEED_IDS.book3 && c.status === 'available')?.id ?? copies[10].id,
                librarianId: SEED_IDS.librarianUser,
                borrowDate: daysAgo(30),
                dueDate: daysAgo(16),
                returnDate: daysAgo(14),
                status: 'returned',
                renewalCount: 0,
                originalDueDate: null,
                renewedAt: null,
                renewedBy: null,
                createdAt: daysAgo(30) + 'T11:00:00Z',
            },
        ]

        // ── Reservations ──────────────────────────────────────────────────────────
        this.reservations = [
            {
                id: uuid(),
                libraryCardId: SEED_IDS.card1,
                bookId: SEED_IDS.book2,
                queuePosition: 1,
                status: 'waiting',
                reservedAt: daysAgo(3) + 'T08:00:00Z',
                notifiedAt: null,
                expiresAt: null,
            },
        ]

        // ── Fines ─────────────────────────────────────────────────────────────────
        const overdueDays = 6
        const amount = 5000 + (overdueDays - 5) * 3000
        this.fines = [
            {
                id: uuid(),
                borrowRecordId: SEED_IDS.borrow2,
                fineType: 'overdue',
                overdueDays,
                amount,
                status: 'pending',
                collectedBy: null,
                paymentMethod: null,
                receiptNumber: null,
                paidAt: null,
                createdAt: daysAgo(1) + 'T00:00:00Z',
            },
        ]
    }
}

// Singleton instance
export const db = new MockDB()