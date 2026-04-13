import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Controller('api/reproducers')
export class ReproducerController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getAll() {
    return this.prisma.db.reproducer.findMany({
      orderBy: { createdAt: 'desc' },
      include: { testRun: { select: { endpoint: true, method: true, type: true } } },
    });
  }
}
