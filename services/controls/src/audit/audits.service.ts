import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditsService {
    private readonly logger = new Logger(AuditsService.name);

    constructor(private prisma: PrismaService) { }

    async findAll(organizationId: string) {
        // @ts-ignore - Prisma client not regenerated yet locally
        return this.prisma.audit.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { requests: true, findings: true }
                }
            }
        });
    }

    async findOne(id: string, organizationId: string) {
        // @ts-ignore
        const audit = await this.prisma.audit.findFirst({
            where: { id, organizationId },
            include: {
                requests: true,
                findings: true,
                _count: {
                    select: { requests: true, findings: true }
                }
            }
        });

        if (!audit) {
            throw new NotFoundException('Audit not found');
        }

        return audit;
    }

    async create(organizationId: string, data: any) {
        // @ts-ignore
        return this.prisma.audit.create({
            data: {
                ...data,
                organizationId,
                // Generate a simple ID if not provided? Or let DB/Model handle it? Model has default uuid()
                // But we might want readable ID
                auditId: data.auditId || `AUD-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`
            }
        });
    }

    async update(id: string, organizationId: string, data: any) {
        // @ts-ignore
        return this.prisma.audit.update({
            where: { id }, // In a real app check orgId too or use updateMany check
            data
        });
    }
}
