import { PrismaService } from './prisma/prisma.service';

const service = new PrismaService();
const test = service.auditLog;
export {};
