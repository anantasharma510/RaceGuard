import { Module } from '@nestjs/common';
import { TestRunnerService } from './test-runner.service';
import { TestRunnerController } from './test-runner.controller';
import { QueueModule } from '../queue/queue.module';
import { EventStoreModule } from '../event-store/event-store.module';
import { GatewayModule } from '../gateway/gateway.module';
import { ReproducerModule } from '../reproducer/reproducer.module';

@Module({
  imports: [QueueModule, EventStoreModule, GatewayModule, ReproducerModule],
  controllers: [TestRunnerController],
  providers: [TestRunnerService],
  exports: [TestRunnerService],
})
export class TestRunnerModule {}
