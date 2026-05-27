import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './entities/user.entity'
import { UserProfile } from './entities/user-profile.entity'
import { Role, RoleName } from './entities/role.entity'

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(UserProfile)
        private profilesRepository: Repository<UserProfile>,
        @InjectRepository(Role)
        private rolesRepository: Repository<Role>,
    ) { }

    async findOne(id: string): Promise<User> {
        const user = await this.usersRepository.findOne({
            where: { id },
            relations: { roleRelation: true, profile: true },
        })
        if (!user) throw new NotFoundException('User not found')
        return user
    }

    async findByEmailOrUsername(identifier: string): Promise<User | null> {
        return this.usersRepository
            .createQueryBuilder('user')
            .addSelect('user.passwordHash')
            .leftJoinAndSelect('user.roleRelation', 'roleRelation')
            .leftJoinAndSelect('user.profile', 'profile')
            .where('user.email = :id OR user.username = :id', { id: identifier })
            .getOne()
    }

    async searchUsers(q: string): Promise<any[]> {
        const raw = await this.usersRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.roleRelation', 'roleRelation')
            .leftJoinAndSelect('user.profile', 'profile')
            .leftJoin('library_cards', 'lc', 'lc.userId = user.id')
            .where('LOWER(user.username) LIKE LOWER(:q)', { q: `%${q}%` })
            .orWhere('LOWER(user.email) LIKE LOWER(:q)', { q: `%${q}%` })
            .orWhere('LOWER(profile.fullName) LIKE LOWER(:q)', { q: `%${q}%` })
            .orWhere('LOWER(profile.idCardNumber) LIKE LOWER(:q)', { q: `%${q}%` })
            .orWhere('LOWER(lc.cardNumber) LIKE LOWER(:q)', { q: `%${q}%` })
            .select([
                'user.id', 'user.username', 'user.email', 'user.isActive',
                'roleRelation',
                'profile',
                'lc.cardNumber',
            ])
            .take(10)
            .getRawAndEntities()

        // Map cardNumber from raw results
        const cardMap = new Map<string, string>()
        for (const r of raw.raw) {
            if (r.user_id && r.lc_cardNumber) {
                cardMap.set(r.user_id, r.lc_cardNumber)
            }
        }

        return raw.entities.map(u => ({
            ...u,
            cardNumber: cardMap.get(u.id) || null,
        }))
    }

    async findByIdWithPassword(id: string): Promise<User> {
        const user = await this.usersRepository
            .createQueryBuilder('user')
            .addSelect('user.passwordHash')
            .where('user.id = :id', { id })
            .getOne()
        if (!user) throw new NotFoundException('User not found')
        return user
    }

    async create(data: {
        username: string
        email: string
        passwordHash: string
        isActive?: boolean
        roleName?: RoleName | string
        profile?: Partial<UserProfile>
    }): Promise<User> {
        const roleName = (data.roleName as RoleName) ?? RoleName.READER
        const role = await this.rolesRepository.findOneBy({ name: roleName })

        const user = this.usersRepository.create({
            username: data.username,
            email: data.email,
            passwordHash: data.passwordHash,
            isActive: data.isActive ?? true,
            roleRelation: role ?? undefined,
        })

        const savedUser = await this.usersRepository.save(user)

        if (data.profile !== undefined) {
            const profile = this.profilesRepository.create({
                ...data.profile,
                userId: savedUser.id,
            })
            await this.profilesRepository.save(profile)
        }

        return this.findOne(savedUser.id)
    }

    async update(id: string, updateData: Partial<User>): Promise<User> {
        await this.usersRepository.update(id, updateData)
        return this.findOne(id)
    }

    async updateProfile(userId: string, profileData: Partial<UserProfile>): Promise<User> {
        await this.profilesRepository.update({ userId }, profileData)
        return this.findOne(userId)
    }

    async findRoleByName(name: RoleName): Promise<Role | null> {
        return this.rolesRepository.findOneBy({ name })
    }
}
