import { Controller, Get } from '@nestjs/common'
import { db } from '../../common/database/seeds/mock-db'

@Controller('categories')
export class CategoriesController {
    @Get()
    list() {
        return db.categories
    }
}
