import { Module } from '@nestjs/common';
import { EventStoreService } from './event-store.service';
import { PrismaService } from '../../prisma.service';

@Module({
  providers: [EventStoreService, PrismaService],
  exports: [EventStoreService],
})
export class EventStoreModule {}
