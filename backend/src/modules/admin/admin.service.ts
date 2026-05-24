import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Role, RoleName } from '../users/entities/role.entity';
import { Book } from '../books/entities/book.entity';
import { BorrowRecord } from '../borrow-records/entities/borrow-record.entity';
import { Fine } from '../fines/entities/fine.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(Book) private bookRepo: Repository<Book>,
        @InjectRepository(BorrowRecord) private borrowRepo: Repository<BorrowRecord>,
        @InjectRepository(Fine) private fineRepo: Repository<Fine>,
        @InjectRepository(Role) private roleRepo: Repository<Role>,
        private usersService: UsersService,
    ) {}

    async getDashboardStats() {
        const totalUsers = await this.userRepo.count();
        const totalBooks = await this.bookRepo.count();
        const borrowedBooks = await this.borrowRepo.count({ where: { status: 'borrowing' } });
        
        const fines = await this.fineRepo.find({ where: { status: 'unpaid' } });
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
