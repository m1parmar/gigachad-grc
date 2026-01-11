import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Patch,
    Query,
    Headers,
    UseGuards,
} from '@nestjs/common';
import { AuditRequestsService } from './audit-requests.service';
import { DevAuthGuard } from '../auth/dev-auth.guard';

@Controller('api/audit-requests')
@UseGuards(DevAuthGuard)
export class AuditRequestsController {
    constructor(private readonly service: AuditRequestsService) { }

    @Get()
    async findAll(
        @Headers('x-organization-id') organizationId: string = 'default',
        @Query() query: any,
    ) {
        return this.service.findAll(organizationId, query);
    }

    @Get(':id')
    async findOne(
        @Param('id') id: string,
        @Headers('x-organization-id') organizationId: string = 'default',
    ) {
        return this.service.findOne(id, organizationId);
    }

    @Post()
    async create(
        @Body() data: any,
        @Headers('x-organization-id') organizationId: string = 'default',
    ) {
        return this.service.create(organizationId, data);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() data: any,
        @Headers('x-organization-id') organizationId: string = 'default',
    ) {
        return this.service.update(id, organizationId, data);
    }
}
