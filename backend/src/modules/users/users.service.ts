import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, ILike } from 'typeorm'
import { User } from './entities/user.entity'

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async findOne(id: string): Promise<User> {
        const user = await this.usersRepository.findOneBy({ id })
        if (!user) throw new NotFoundException('User not found')
        return user
    }

    async findByEmailOrUsername(identifier: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: [
                { email: identifier },
                { username: identifier }
            ],
            select: ['id', 'username', 'email', 'passwordHash', 'role', 'isActive', 'fullName']
        })
    }

    async searchUsers(q: string): Promise<User[]> {
        return this.usersRepository.find({
            where: [
                { username: ILike(`%${q}%`) },
                { idCardNumber: ILike(`%${q}%`) },
                { fullName: ILike(`%${q}%`) }
            ],
            select: ['id', 'username', 'email', 'role', 'isActive', 'fullName', 'idCardNumber'],
            take: 10
        });
    }

    async findByIdWithPassword(id: string): Promise<User> {
        const user = await this.usersRepository.findOne({
            where: { id },
            select: ['id', 'passwordHash']
        })
        if (!user) throw new NotFoundException('User not found')
        return user
    }

    async create(userData: Partial<User>): Promise<User> {
        const user = this.usersRepository.create(userData)
        return this.usersRepository.save(user)
    }

    async update(id: string, updateData: Partial<User>): Promise<User> {
        await this.usersRepository.update(id, updateData)
        return this.findOne(id)
    }
}

