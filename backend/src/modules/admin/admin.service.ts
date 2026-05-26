import { Injectable, NotFoundException } from '@nestjs/common';
import { In, LessThan } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Role, RoleName } from '../users/entities/role.entity';
import { Book } from '../books/entities/book.entity';
import { BookCopy } from '../books/entities/book-copy.entity';
import { BorrowRecord } from '../borrow-records/entities/borrow-record.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Fine } from '../fines/entities/fine.entity';
import { LibraryCard } from '../library-cards/entities/library-card.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(Book) private bookRepo: Repository<Book>,
        @InjectRepository(BookCopy) private copyRepo: Repository<BookCopy>,
        @InjectRepository(BorrowRecord) private borrowRepo: Repository<BorrowRecord>,
        @InjectRepository(Reservation) private resRepo: Repository<Reservation>,
        @InjectRepository(Fine) private fineRepo: Repository<Fine>,
        @InjectRepository(Role) private roleRepo: Repository<Role>,
        @InjectRepository(LibraryCard) private cardRepo: Repository<LibraryCard>,
        private usersService: UsersService,
    ) {}

    async getDashboardStats() {
        const totalUsers = await this.userRepo.count();
        const totalBooks = await this.bookRepo.count();
        const borrowedBooks = await this.borrowRepo.count({ where: { status: 'borrowing' } });
        
        const fines = await this.fineRepo.find({ where: { status: 'pending' } });
        const totalFines = fines.reduce((sum, f) => sum + Number(f.amount), 0);

        const recentActivities = [
            { id: 1, type: 'create', user: 'System', content: 'Khởi tạo dashboard', time: new Date().toISOString(), color: 'emerald' }
        ];

        const systemAlerts = [
            { label: 'Hệ thống đang hoạt động tốt', type: 'healthy', action: 'Chi tiết' }
        ];

        const topBooksRaw = await this.borrowRepo
            .createQueryBuilder('borrow')
            .leftJoin('borrow.bookCopy', 'copy')
            .leftJoin('copy.book', 'book')
            .select('book.title', 'title')
            .addSelect('COUNT(borrow.id)', 'count')
            .groupBy('book.id')
            .orderBy('count', 'DESC')
            .limit(5)
            .getRawMany();

        const topBooks = topBooksRaw.map((b, index) => ({
            rank: index + 1,
            title: b.title,
            count: Number(b.count)
        }));

        const categoriesRaw = await this.bookRepo
            .createQueryBuilder('book')
            .leftJoin('book.category', 'category')
            .select('category.name', 'label')
            .addSelect('COUNT(book.id)', 'count')
            .groupBy('category.id')
            .getRawMany();

        const totalCategoryBooks = categoriesRaw.reduce((sum, c) => sum + Number(c.count), 0);
        const colors = ['bg-indigo-500', 'bg-amber-500', 'bg-emerald-500', 'bg-sky-500', 'bg-slate-400', 'bg-purple-500', 'bg-pink-500'];
        const categoryStats = categoriesRaw.map((c, index) => ({
            label: c.label || 'Không phân loại',
            count: Number(c.count),
            p: totalCategoryBooks > 0 ? Math.round((Number(c.count) / totalCategoryBooks) * 100) + '%' : '0%',
            color: colors[index % colors.length]
        }));

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const borrowStatsRaw = await this.borrowRepo
            .createQueryBuilder('borrow')
            .select('borrow.borrowDate', 'date')
            .addSelect('COUNT(borrow.id)', 'count')
            .where('borrow.borrowDate >= :date', { date: thirtyDaysAgo.toISOString().split('T')[0] })
            .groupBy('borrow.borrowDate')
            .orderBy('borrow.borrowDate', 'ASC')
            .getRawMany();

        const borrowStats = borrowStatsRaw.map(b => ({
            date: b.date,
            count: Number(b.count)
        }));

        return {
            totalUsers,
            totalBooks,
            borrowedBooks,
            totalFines,
            recentActivities,
            systemAlerts,
            topBooks,
            categoryStats,
            borrowStats
        };
    }

    async getBookReports() {
        // 1. Top borrowed books
        const topBorrowedRaw = await this.borrowRepo
            .createQueryBuilder('borrow')
            .leftJoin('borrow.bookCopy', 'copy')
            .leftJoin('copy.book', 'book')
            .leftJoin('book.category', 'category')
            .select('book.id', 'bookId')
            .addSelect('book.title', 'title')
            .addSelect('book.author', 'author')
            .addSelect('category.name', 'category')
            .addSelect('COUNT(borrow.id)', 'totalBorrows')
            .addSelect('AVG(COALESCE(borrow.returnDate, CURRENT_DATE) - borrow.borrowDate)', 'avgDays')
            .groupBy('book.id')
            .addGroupBy('book.title')
            .addGroupBy('book.author')
            .addGroupBy('category.name')
            .orderBy('COUNT(borrow.id)', 'DESC')
            .limit(20)
            .getRawMany();

        const topBorrowed = topBorrowedRaw.map((b, index) => ({
            rank: index + 1,
            title: b.title,
            author: b.author || '—',
            category: b.category || 'Chưa phân loại',
            totalBorrows: Number(b.totalBorrows),
            avgBorrowDays: b.avgDays ? Math.round(Number(b.avgDays) * 10) / 10 : 0,
        }));

        // 2. Stock status — books with available/total copies
        const stockBooks = await this.bookRepo.find({
            relations: ['category'],
            order: { title: 'ASC' }
        });
        const stockStatus = stockBooks.map(b => {
            const borrowedCopies = b.totalCopies - b.availableCopies;
            const critical = b.availableCopies === 0;
            let action: string | null = null;
            if (critical && b.totalCopies > 0) {
                action = 'Đề xuất mua thêm';
            } else if (!critical && borrowedCopies === 0 && b.totalCopies > 0) {
                action = '⚠️ Ít được mượn';
            }
            return {
                bookId: b.id,
                title: b.title,
                category: b.category?.name || 'Chưa phân loại',
                totalCopies: b.totalCopies,
                availableCopies: b.availableCopies,
                borrowedCopies,
                critical,
                action,
            };
        });

        // 3. Replenishment — books with reservations waiting and low available copies
        const replenishRaw = await this.resRepo
            .createQueryBuilder('res')
            .leftJoin('res.book', 'book')
            .select('book.id', 'bookId')
            .addSelect('book.title', 'title')
            .addSelect('book.totalCopies', 'totalCopies')
            .addSelect('COUNT(res.id)', 'queueCount')
            .where('res.status = :status', { status: 'waiting' })
            .groupBy('book.id')
            .addGroupBy('book.title')
            .addGroupBy('book.totalCopies')
            .orderBy('COUNT(res.id)', 'DESC')
            .limit(20)
            .getRawMany();

        const replenishment = replenishRaw.map(r => ({
            bookId: r.bookId,
            title: r.title,
            totalCopies: Number(r.totalCopies),
            queueCount: Number(r.queueCount),
            suggestion: `Mua thêm ${Math.min(Number(r.queueCount), 10)} bản`,
        }));

        // 4. Disposal — damaged / lost / disposed copies
        const disposedCopies = await this.copyRepo.find({
            where: [
                { status: 'lost' as any },
                { status: 'disposed' as any },
                { condition: 'damaged' as any, status: 'available' as any },
            ],
            relations: ['book'],
            order: { createdAt: 'DESC' },
            take: 50,
        });

        const disposal = disposedCopies.map(c => ({
            bookId: c.bookId,
            title: c.book?.title || '—',
            copyCode: c.copyCode,
            condition: c.status === 'lost' ? 'Mất (đã xử lý)' :
                       c.status === 'disposed' ? 'Đã thanh lý' :
                       c.condition === 'damaged' ? 'Hư hỏng nặng' : c.condition,
            importedAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : '—',
            action: c.status === 'lost' || c.status === 'disposed' ? 'Xóa khỏi hệ thống' : 'Thanh lý',
        }));

        return {
            topBorrowed,
            stockStatus,
            replenishment,
            disposal,
        };
    }

    async getAuditLogs() {
        const logs: {
            id: string;
            time: string;
            user: string;
            action: string;
            table: string;
            content: string;
            ip: string;
        }[] = [];

        // 1. Borrow records — mượn sách
        const recentBorrows = await this.borrowRepo.find({
            relations: [
                'bookCopy', 'bookCopy.book',
                'libraryCard', 'libraryCard.user', 'libraryCard.user.profile',
                'librarian', 'librarian.profile'
            ],
            order: { createdAt: 'DESC' },
            take: 30,
        });
        for (const b of recentBorrows) {
            const userName = b.libraryCard?.user?.profile?.fullName || b.libraryCard?.user?.username || '—';
            const librarianName = b.librarian?.profile?.fullName || b.librarian?.username || 'Hệ thống';
            logs.push({
                id: `borrow-${b.id}`,
                time: b.createdAt?.toISOString?.() || new Date().toISOString(),
                user: librarianName,
                action: 'INSERT',
                table: 'borrow_records',
                content: `Tạo phiếu mượn cho ${userName}: ${b.bookCopy?.book?.title || '—'}`,
                ip: '—',
            });
        }

        // 2. Fines — phát sinh phí phạt
        const recentFines = await this.fineRepo.find({
            relations: [
                'borrowRecord', 'borrowRecord.libraryCard',
                'borrowRecord.libraryCard.user', 'borrowRecord.libraryCard.user.profile'
            ],
            order: { createdAt: 'DESC' },
            take: 30,
        });
        for (const f of recentFines) {
            const readerName = f.borrowRecord?.libraryCard?.user?.profile?.fullName || f.borrowRecord?.libraryCard?.user?.username || '—';
            const amount = Number(f.amount).toLocaleString('vi-VN');
            logs.push({
                id: `fine-${f.id}`,
                time: f.createdAt?.toISOString?.() || new Date().toISOString(),
                user: 'Hệ thống',
                action: 'INSERT',
                table: 'fines',
                content: `Phát sinh phí phạt ${amount}đ cho ${readerName} (${f.fineType === 'overdue' ? 'quá hạn' : f.fineType === 'damaged' ? 'hư hỏng' : 'mất sách'})`,
                ip: '—',
            });
        }

        // 3. Reservations — đặt trước sách
        const recentReservations = await this.resRepo.find({
            relations: [
                'libraryCard', 'libraryCard.user', 'libraryCard.user.profile',
                'book'
            ],
            order: { reservedAt: 'DESC' },
            take: 30,
        });
        for (const r of recentReservations) {
            const userName = r.libraryCard?.user?.profile?.fullName || r.libraryCard?.user?.username || '—';
            const action = r.status === 'cancelled' ? 'DELETE' : 'INSERT';
            logs.push({
                id: `reservation-${r.id}`,
                time: r.reservedAt?.toISOString?.() || new Date().toISOString(),
                user: userName,
                action,
                table: 'reservations',
                content: action === 'INSERT'
                    ? `Đặt trước sách ${r.book?.title || '—'} (vị trí #${r.queuePosition})`
                    : `Hủy đặt trước sách ${r.book?.title || '—'}`,
                ip: '—',
            });
        }

        // 4. Library cards — cấp thẻ mới
        const recentCards = await this.cardRepo.find({
            relations: ['user', 'user.profile', 'issuedBy', 'issuedBy.profile'],
            order: { createdAt: 'DESC' },
            take: 30,
        });
        for (const c of recentCards) {
            const userName = c.user?.profile?.fullName || c.user?.username || '—';
            const issuerName = c.issuedBy?.profile?.fullName || c.issuedBy?.username || 'Hệ thống';
            logs.push({
                id: `card-${c.id}`,
                time: c.createdAt?.toISOString?.() || new Date().toISOString(),
                user: issuerName,
                action: 'INSERT',
                table: 'library_cards',
                content: `Cấp thẻ mới ${c.cardNumber} cho ${userName}`,
                ip: '—',
            });
        }

        // 5. Users — đăng ký tài khoản
        const recentUsers = await this.userRepo.find({
            relations: ['profile'],
            order: { createdAt: 'DESC' },
            take: 30,
        });
        for (const u of recentUsers) {
            const userName = u.profile?.fullName || u.username || '—';
            logs.push({
                id: `user-${u.id}`,
                time: u.createdAt?.toISOString?.() || new Date().toISOString(),
                user: userName,
                action: 'INSERT',
                table: 'users',
                content: `Đăng ký tài khoản mới: ${u.email} (${u.role || 'reader'})`,
                ip: '—',
            });
        }

        // 6. Recent borrow requests
        const recentRequests = await this.borrowRepo.manager
            .getRepository('borrow_requests')
            .find({
                relations: [
                    'libraryCard', 'libraryCard.user', 'libraryCard.user.profile',
                    'book', 'processedBy', 'processedBy.profile'
                ],
                order: { requestedAt: 'DESC' },
                take: 20,
            });
        for (const br of recentRequests) {
            const actionMap: Record<string, string> = {
                pending: 'INSERT',
                approved: 'UPDATE',
                rejected: 'UPDATE',
                cancelled: 'DELETE',
            };
            const userName = br.libraryCard?.user?.profile?.fullName || br.libraryCard?.user?.username || '—';
            const processorName = br.processedBy?.profile?.fullName || br.processedBy?.username || '—';
            const action = actionMap[br.status as string] || 'INSERT';

            let content = '';
            if (br.status === 'pending') {
                content = `Yêu cầu mượn sách ${br.book?.title || '—'} từ ${userName}`;
            } else if (br.status === 'approved') {
                content = `Phê duyệt yêu cầu mượn ${br.book?.title || '—'} cho ${userName} (bởi ${processorName})`;
            } else if (br.status === 'rejected') {
                content = `Từ chối yêu cầu mượn ${br.book?.title || '—'} cho ${userName}: ${br.rejectionReason || '—'}`;
            } else {
                content = `Hủy yêu cầu mượn ${br.book?.title || '—'} từ ${userName}`;
            }

            logs.push({
                id: `borrow-request-${br.id}`,
                time: (br.requestedAt as any)?.toISOString?.() || new Date().toISOString(),
                user: userName,
                action,
                table: 'borrow_requests',
                content,
                ip: '—',
            });
        }

        // Sort by time DESC and limit to 100
        logs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        return logs.slice(0, 100);
    }

    async getViolationReports() {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // 1. Độc giả quá hạn
        const overdueList = await this.borrowRepo.find({
            where: {
                status: In(['borrowing', 'overdue']),
                dueDate: LessThan(todayStr)
            },
            relations: [
                'bookCopy', 'bookCopy.book',
                'libraryCard', 'libraryCard.user', 'libraryCard.user.profile'
            ],
            order: { dueDate: 'ASC' }
        });

        const overdueReaders = overdueList.map(b => {
            const due = new Date(b.dueDate);
            const diffTime = today.getTime() - due.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return {
                id: b.id,
                name: b.libraryCard?.user?.profile?.fullName || b.libraryCard?.user?.username || '—',
                cardNumber: b.libraryCard?.cardNumber || '—',
                bookTitle: b.bookCopy?.book?.title || '—',
                dueDate: b.dueDate,
                overdueDays: diffDays,
                status: diffDays > 5 ? 'critical' : 'warning',
            };
        });

        // 2. Thẻ sắp hết hạn (trong vòng 30 ngày tới)
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
        const thirtyDaysLaterStr = thirtyDaysLater.toISOString().split('T')[0];

        const expiringCards = await this.cardRepo.find({
            where: {
                status: 'active',
                expiryDate: LessThan(thirtyDaysLaterStr),
            },
            relations: ['user', 'user.profile'],
            order: { expiryDate: 'ASC' }
        });

        const expiringList = expiringCards.map(c => ({
            id: c.id,
            name: c.user?.profile?.fullName || c.user?.username || '—',
            cardNumber: c.cardNumber,
            expiryDate: c.expiryDate,
            status: 'warning',
        }));

        // 3. Độc giả quá hạn nhiều lần (có > 1 lần quá hạn)
        const allBorrows = await this.borrowRepo.find({
            where: { status: 'overdue' },
            relations: ['libraryCard', 'libraryCard.user', 'libraryCard.user.profile'],
            order: { createdAt: 'DESC' }
        });

        const userViolationMap = new Map<string, { count: number; records: any[] }>();
        for (const b of allBorrows) {
            const userId = b.libraryCard?.userId;
            if (!userId) continue;
            if (!userViolationMap.has(userId)) {
                userViolationMap.set(userId, { count: 0, records: [] });
            }
            const entry = userViolationMap.get(userId)!;
            entry.count++;
            if (entry.records.length < 5) {
                entry.records.push({
                    date: b.borrowDate,
                    dueDate: b.dueDate,
                });
            }
        }

        const frequentViolators = Array.from(userViolationMap.entries())
            .filter(([_, v]) => v.count > 1)
            .map(([userId, v]) => {
                const borrow = allBorrows.find(b => b.libraryCard?.userId === userId);
                return {
                    userId,
                    name: borrow?.libraryCard?.user?.profile?.fullName || borrow?.libraryCard?.user?.username || '—',
                    cardNumber: borrow?.libraryCard?.cardNumber || '—',
                    violationCount: v.count,
                    lastViolation: v.records[0]?.dueDate || '—',
                };
            })
            .sort((a, b) => b.violationCount - a.violationCount);

        // 4. Độc giả còn nợ phí
        const unpaidFines = await this.fineRepo.find({
            where: { status: 'pending' },
            relations: [
                'borrowRecord', 'borrowRecord.libraryCard',
                'borrowRecord.libraryCard.user', 'borrowRecord.libraryCard.user.profile'
            ],
            order: { createdAt: 'DESC' }
        });

        // Gộp theo user
        const userFineMap = new Map<string, {
            name: string; cardNumber: string;
            totalAmount: number; fineCount: number;
            fines: { id: string; amount: number; type: string; createdAt: string }[];
        }>();
        for (const f of unpaidFines) {
            const user = f.borrowRecord?.libraryCard?.user;
            const userId = user?.id;
            if (!userId) continue;
            if (!userFineMap.has(userId)) {
                userFineMap.set(userId, {
                    name: user?.profile?.fullName || user?.username || '—',
                    cardNumber: f.borrowRecord?.libraryCard?.cardNumber || '—',
                    totalAmount: 0,
                    fineCount: 0,
                    fines: [],
                });
            }
            const entry = userFineMap.get(userId)!;
            entry.totalAmount += Number(f.amount);
            entry.fineCount++;
            entry.fines.push({
                id: f.id,
                amount: Number(f.amount),
                type: f.fineType,
                createdAt: f.createdAt instanceof Date ? f.createdAt.toISOString() : String(f.createdAt),
            });
        }

        const unpaidList = Array.from(userFineMap.values())
            .sort((a, b) => b.totalAmount - a.totalAmount);

        return {
            overdueReaders,
            expiringCards: expiringList,
            frequentViolators,
            unpaidFines: unpaidList,
            totals: {
                overdueCount: overdueReaders.length,
                expiringCount: expiringList.length,
                frequentCount: frequentViolators.length,
                unpaidCount: unpaidList.length,
            },
        };
    }

    async getAllUsers() {
        return this.userRepo.find({
            relations: ['roleRelation', 'profile'],
            order: { createdAt: 'DESC' }
        });
    }

    async updateUserRole(userId: string, roleName: RoleName) {
        const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['roleRelation'] });
        if (!user) throw new NotFoundException('User not found');
        
        const role = await this.roleRepo.findOneBy({ name: roleName });
        if (!role) throw new NotFoundException('Role not found');

        user.roleRelation = role;
        await this.userRepo.save(user);
        return this.usersService.findOne(userId);
    }

    async toggleUserStatus(userId: string, isActive: boolean) {
        await this.userRepo.update(userId, { isActive });
        return this.usersService.findOne(userId);
    }
}
