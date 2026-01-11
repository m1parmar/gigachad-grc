import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditRequestsService {
    private readonly logger = new Logger(AuditRequestsService.name);

    constructor(private prisma: PrismaService) { }

    async findAll(organizationId: string, query: any) {
        const where: any = { organizationId };

        if (query.status) where.status = query.status;
        if (query.priority) where.priority = query.priority;
        if (query.auditId) where.auditId = query.auditId;

        // @ts-ignore
        return this.prisma.auditRequest.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                audit: {
                    select: {
                        id: true,
                        auditId: true,
                        name: true,
                        status: true,
                    }
                },
                _count: {
                    select: { evidence: true, comments: true }
                }
            }
        });
    }

    async findOne(id: string, organizationId: string) {
        // @ts-ignore
        const request = await this.prisma.auditRequest.findFirst({
            where: { id, organizationId },
            include: {
                audit: {
                    select: {
                        id: true,
                        auditId: true,
                        name: true,
                    }
                },
                evidence: true,
                comments: true,
            }
        });

        if (!request) {
            throw new NotFoundException('Audit request not found');
        }

        return request;
    }

    async create(organizationId: string, data: any) {
        // Generate request number
        const count = await this.prisma.audit.count({ where: { organizationId } }) || 0;
        const requestNumber = `REQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;

        // @ts-ignore
        return this.prisma.auditRequest.create({
            data: {
                ...data,
                organizationId,
                requestNumber: data.requestNumber || requestNumber
            }
        });
    }

    async update(id: string, organizationId: string, data: any) {
        // @ts-ignore
        return this.prisma.auditRequest.update({
            where: { id },
            data
        });
    }
}
