import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm'
import { Shift } from './entities/shift.entity'
import { User } from '@/modules/users/entities/user.entity'

@Injectable()
export class ShiftsService {
    constructor(
        @InjectRepository(Shift)
        private shiftRepo: Repository<Shift>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
    ) { }

    async create(dto: { librarianId: string; startTime: string; endTime: string; note?: string }) {
        const librarian = await this.userRepo.findOneBy({ id: dto.librarianId })
        if (!librarian) throw new NotFoundException('Không tìm thấy thủ thư')

        const start = new Date(dto.startTime)
        const end = new Date(dto.endTime)
        if (end <= start) throw new BadRequestException('Giờ kết thúc phải sau giờ bắt đầu')

        // Kiểm tra trùng ca (overlap chuẩn: A.start < B.end AND A.end > B.start)
        const overlapping = await this.shiftRepo.createQueryBuilder('shift')
            .where('shift.librarianId = :librarianId', { librarianId: dto.librarianId })
            .andWhere('shift.startTime < :endTime', { endTime: end })
            .andWhere('shift.endTime > :startTime', { startTime: start })
            .getOne()
        if (overlapping) {
            throw new BadRequestException('Thủ thư này đã có ca trực trong khung giờ này')
        }

        const shift = this.shiftRepo.create({
            librarianId: dto.librarianId,
            startTime: start,
            endTime: end,
            note: dto.note,
        })
        return this.shiftRepo.save(shift)
    }

    async findAll() {
        return this.shiftRepo.find({
            relations: { librarian: { profile: true } },
            order: { startTime: 'DESC' },
        })
    }

    async findMine(userId: string) {
        return this.shiftRepo.find({
            where: { librarianId: userId },
            order: { startTime: 'DESC' },
        })
    }

    async findCurrentShift(userId: string): Promise<Shift | null> {
        const now = new Date()
        return this.shiftRepo.findOne({
            where: {
                librarianId: userId,
                startTime: LessThanOrEqual(now),
                endTime: MoreThanOrEqual(now),
            },
            relations: { librarian: true },
        })
    }

    /** Kiểm tra thủ thư có đang trong ca trực không */
    async isOnShift(userId: string): Promise<boolean> {
        // Nếu là admin thì luôn true
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: { roleRelation: true },
        })
        if (user?.roleRelation?.name === 'library_admin') return true

        const shift = await this.findCurrentShift(userId)
        return shift !== null
    }

    /** Lấy khoảng thời gian ca trực hiện tại (nếu đang trực), nếu không thì null */
    async getCurrentShiftRange(userId: string): Promise<{ start: Date; end: Date } | null> {
        const shift = await this.findCurrentShift(userId)
        if (!shift) return null
        return { start: shift.startTime, end: shift.endTime }
    }

    async deleteShift(id: string) {
        const shift = await this.shiftRepo.findOneBy({ id })
        if (!shift) throw new NotFoundException('Không tìm thấy ca trực')
        return this.shiftRepo.delete(id)
    }
}
