import { Module } from '@nestjs/common';
import { TestRunnerService } from './test-runner.service';
import { QueueModule } from '../queue/queue.module';
import { EventStoreModule } from '../event-store/event-store.module';

@Module({
  imports: [QueueModule, EventStoreModule],
  providers: [TestRunnerService],
  exports: [TestRunnerService],
})
export class TestRunnerModule {}
