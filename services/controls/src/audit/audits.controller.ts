import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Delete,
    Headers,
    UseGuards,
} from '@nestjs/common';
import { AuditsService } from './audits.service';
import { DevAuthGuard } from '../auth/dev-auth.guard';
import { PermissionGuard } from '../auth/permission.guard';

@Controller('api/audits')
@UseGuards(DevAuthGuard)
export class AuditsController {
    constructor(private readonly auditsService: AuditsService) { }

    @Get()
    async findAll(@Headers('x-organization-id') organizationId: string = 'default') {
        return this.auditsService.findAll(organizationId);
    }

    @Get(':id')
    async findOne(
        @Param('id') id: string,
        @Headers('x-organization-id') organizationId: string = 'default',
    ) {
        return this.auditsService.findOne(id, organizationId);
    }

    @Post()
    async create(
        @Body() data: any,
        @Headers('x-organization-id') organizationId: string = 'default',
    ) {
        return this.auditsService.create(organizationId, data);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() data: any,
        @Headers('x-organization-id') organizationId: string = 'default',
    ) {
        return this.auditsService.update(id, organizationId, data);
    }
}
