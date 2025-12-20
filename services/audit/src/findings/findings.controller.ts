import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Headers,
} from '@nestjs/common';
import { FindingsService } from './findings.service';
import { CreateFindingDto } from './dto/create-finding.dto';
import { UpdateFindingDto } from './dto/update-finding.dto';

@Controller('findings')
export class FindingsController {
  constructor(private readonly findingsService: FindingsService) {}

  @Post()
  create(
    @Body() createFindingDto: CreateFindingDto,
    @Headers('x-user-id') userId: string,
  ) {
    return this.findingsService.create(createFindingDto, userId || 'system');
  }

  @Get()
  findAll(
    @Headers('x-organization-id') organizationId: string,
    @Query('auditId') auditId?: string,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('category') category?: string,
    @Query('remediationOwner') remediationOwner?: string,
  ) {
    return this.findingsService.findAll(organizationId, {
      auditId,
      status,
      severity,
      category,
      remediationOwner,
    });
  }

  @Get('stats')
  getStats(@Headers('x-organization-id') organizationId: string) {
    return this.findingsService.getStats(organizationId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Headers('x-organization-id') organizationId: string,
  ) {
    return this.findingsService.findOne(id, organizationId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Headers('x-organization-id') organizationId: string,
    @Body() updateFindingDto: UpdateFindingDto,
  ) {
    return this.findingsService.update(id, organizationId, updateFindingDto);
  }

  @Delete(':id')
  delete(
    @Param('id') id: string,
    @Headers('x-organization-id') organizationId: string,
  ) {
    return this.findingsService.delete(id, organizationId);
  }

  @Post('bulk/status')
  bulkUpdateStatus(
    @Headers('x-organization-id') organizationId: string,
    @Body() body: { ids: string[]; status: string },
  ) {
    return this.findingsService.bulkUpdateStatus(body.ids, organizationId, body.status);
  }
}





