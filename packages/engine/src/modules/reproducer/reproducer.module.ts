import { Module } from '@nestjs/common';
import { ReproducerService } from './reproducer.service';
import { EventStoreModule } from '../event-store/event-store.module';

@Module({
  imports: [EventStoreModule],
  providers: [ReproducerService],
  exports: [ReproducerService],
})
export class ReproducerModule {}
