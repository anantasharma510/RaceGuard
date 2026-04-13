import { Module } from '@nestjs/common';
import { ReproducerService } from './reproducer.service';
import { ReproducerController } from './reproducer.controller';
import { EventStoreModule } from '../event-store/event-store.module';
import { PrismaService } from '../../prisma.service';

@Module({
  imports: [EventStoreModule],
  controllers: [ReproducerController],
  providers: [ReproducerService, PrismaService],
  exports: [ReproducerService],
})
export class ReproducerModule {}
